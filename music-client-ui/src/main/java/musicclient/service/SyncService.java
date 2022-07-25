package musicclient.service;

import lombok.extern.log4j.Log4j2;
import music.exception.TaskInProgressException;
import music.model.Track;
import music.utils.HashUtils;
import musicclient.settings.PublicSettings;
import musicclient.SyncWebsocket;
import musicclient.model.impl.SyncResult;
import musicclient.model.impl.SyncStep;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.net.URLConnection;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@Log4j2
public class SyncService extends AbstractService {
	private final AtomicBoolean currentlySyncing = new AtomicBoolean(false);

    private final TrackService trackService;

    private final HashService hashService;

    private final SyncWebsocket syncWebsocket;

    private final PublicSettings publicSettings;

    private final String RENAME_SEPARATOR = "_";

    public SyncService(TrackService trackService, HashService hashService, SyncWebsocket syncWebsocket, PublicSettings publicSettings) {
        this.trackService = trackService;
        this.hashService = hashService;
        this.syncWebsocket = syncWebsocket;
        this.publicSettings = publicSettings;
    }

    public SyncResult performSync(List<Track> tracksToSync) throws IOException, TaskInProgressException {
		checkNotSyncing();
		try {
			currentlySyncing.set(true);
			SyncResult syncResult = new SyncResult();
			if (tracksToSync != null) {
				Map<String, File> existingFilesHash = determineExistingFilesHashes();
                Map<String, String> newFilesHashes = new ConcurrentHashMap<>();

                // for each file to be synced, see if it already exists on disk and hashes match
                List<Track> actualTracksToSync = new ArrayList<>();
                for (Track track : tracksToSync) {
                    if (!existingFilesHash.containsKey(track.getHash())) {
                        actualTracksToSync.add(track);
                    }
                }
                log.info("{} tracks to sync", actualTracksToSync);

                // if there are files on disk that do not match any hash in the tracks to sync array, delete them
                for (Map.Entry<String, File> existingFile : existingFilesHash.entrySet()) {
                    File file = existingFile.getValue();
                    String hash = existingFile.getKey();

                    if (tracksToSync.stream().noneMatch(track -> {
                        try {
                            return track.getHash().equals(hash);
                        } catch (IOException e) {
                            // I don't think this will ever happen.
                            log.error("Failed to read hash of {}", track.getId());
                            return false;
                        }
                    })){
                        log.debug("Deleting {} whose hash does not match any of the files to be synced", file);
                        FileUtils.delete(file);
                        existingFilesHash.remove(hash);
                        syncResult.setUnmatchedDeletedFiles(syncResult.getUnmatchedDeletedFiles() + 1);
                    } else {
                        // Adding this file to the new file hashes map because it will remain on disk, untouched.
                        newFilesHashes.put(file.getName(), hash);
                    }
                }

                performSync(actualTracksToSync, existingFilesHash, newFilesHashes, syncResult);
				hashService.dumpHashesToDisk(newFilesHashes);
				// after generating the new hash dump, reload the cache
				trackService.clearCacheFromHashDump();
				trackService.buildCacheFromHashDump();
			}
			syncResult.setSuccess(true);
			log.info(syncResult.toString());
			currentlySyncing.set(false);
			return syncResult;
		} catch (Exception e) {
			currentlySyncing.set(false);
			throw e;
		}
    }

    private void performSync(List<Track> tracksToSync, Map<String, File> existingFilesHash, Map<String, String> newFilesHashes, SyncResult syncResult) {
        // run the sync
        AtomicInteger trackIndex = new AtomicInteger(-1);
        syncWebsocket.sendSyncUpdateMessage(trackIndex.get(), tracksToSync.size(), SyncStep.SYNCING);
        SyncSettings syncSettings = new SyncSettings();
        // find existing files which match the hashes of files to sync, otherwise download the file from the server
        tracksToSync.parallelStream().forEach((track) -> {
            try {
                int index = trackIndex.incrementAndGet();
                syncWebsocket.sendSyncUpdateMessage(index, tracksToSync.size(), SyncStep.SYNCING);
                String destinationFilename = track.getId() + "." + FilenameUtils.getExtension(track.getLocation());
                String destinationPath = Objects.requireNonNull(localMusicFileLocation) + destinationFilename;
                File existingFile = existingFilesHash.get(track.getHash());
                if (existingFile != null) {
                    log.info("Track {} of {} already exists on disk (ID: {})", (index + 1), tracksToSync.size(), track.getId());
                    FileUtils.moveFile(existingFile, new File(destinationPath));
                    existingFilesHash.remove(track.getHash());
                    newFilesHashes.put(destinationFilename, track.getHash());
                    syncResult.incrementExistingFiles();
                } else {
                    log.info("Syncing track {} of {} to disk (ID: {})", (index + 1), tracksToSync.size(), track.getId());
                    URL url = new URL(publicSettings.getServerApiUrl() + "/track/" + track.getId() + "/stream");
                    log.debug("URL: {}", url);
                    log.debug("Destination path: {}", destinationPath);
                    try {
                        URLConnection connection = url.openConnection();
                        connection.setRequestProperty("Authorization", publicSettings.getServerApiAuthHeader());
                        connection.setReadTimeout(syncSettings.getReadTimeout());
                        connection.setConnectTimeout(syncSettings.getConnectTimeout());

                        FileUtils.copyInputStreamToFile(connection.getInputStream(), new File(destinationPath));
                        // ensure downloaded file matches expected
                        String downloadedFileHash = HashUtils.calculateHash(new File(destinationPath));
                        if (downloadedFileHash.equals(track.getHash())) {
                            log.debug("Successfully downloaded track {}, hashes match", track.getTitle());
                            newFilesHashes.put(destinationFilename, track.getHash());
                            syncResult.incrementNewlyDownloadedFiles();
                        } else {
                            log.error("Failed to download track {}, hashes don't match, deleting downloaded file", track.getTitle());
                            boolean deletedSuccessfully = FileUtils.deleteQuietly(new File(destinationPath));
                            if (!deletedSuccessfully) {
                                log.error("Failed to delete track {}", track.getId());
                            }
                            syncResult.addFailedDownloadedFile(track);
                        }
                    } catch (Exception e) {
                        log.error("Failed to download track {}, deleting downloaded file", track.getTitle(), e);
                        boolean deletedSuccessfully = FileUtils.deleteQuietly(new File(destinationPath));
                        if (!deletedSuccessfully) {
                            log.error("Failed to delete track {}", destinationPath);
                        }
                        syncResult.addFailedDownloadedFile(track);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to sync track {}", track.getId(), e);
            }
        });
    }

    private Map<String, File> determineExistingFilesHashes() throws IOException {
        Map<String, String> hashDump = hashService.loadExistingHashDump();
        Map<String, File> existingFilesHash = new ConcurrentHashMap<>(hashDump.size());
        Collection<File> existingFiles = trackService.listFiles();
        AtomicInteger existingFileCount = new AtomicInteger(0);
        syncWebsocket.sendSyncUpdateMessage(-1, existingFiles.size(), SyncStep.HASHING_EXISTING);
        existingFiles.parallelStream().forEach((existingFile) -> {
            existingFileCount.incrementAndGet();
            log.debug("Hashing {} of {}: {}", existingFileCount, existingFiles.size(), existingFile.getName());
            if (existingFileCount.get() % 100 == 0) {
                log.info("Hashed {} of a total of {} files", existingFileCount, existingFiles.size());
            }
            String renamedFileHash = null;
            if (hashDump.containsKey(existingFile.getName())) {
                log.debug("Hash dump contains hash for existing file {}, loading instead of recalculating", existingFile.getName());
                renamedFileHash = hashDump.get(existingFile.getName());
            } else {
                log.debug("Hash dump does not contain hash for existing file {}, calculating hash", existingFile.getName());
                syncWebsocket.sendSyncUpdateMessage(existingFileCount.get(), existingFiles.size(), SyncStep.HASHING_EXISTING);
                try {
                    renamedFileHash = HashUtils.calculateHash(existingFile);
                } catch (IOException e) {
                    log.error("Failed to calculate hash for file {}", existingFile.getName(), e);
                }
            }
            if (renamedFileHash != null) {
                existingFilesHash.put(renamedFileHash, existingFile);
            }
        });
        return existingFilesHash;
    }

	private void checkNotSyncing() throws TaskInProgressException {
		if (currentlySyncing.get()) {
			throw new TaskInProgressException("sync");
		}
	}

	private static class SyncSettings {
        @Value("${sync.connect_timeout:#{15}}")
        private String connectTimeout;

        @Value("${sync.read_timeout:#{60}}")
        private String readTimeout;

        public int getConnectTimeout() {
            return tryParseInt(connectTimeout, 15);
        }

        public int getReadTimeout() {
            return tryParseInt(readTimeout, 60);
        }

        private int tryParseInt(String val, int defaultValue) {
            try {
                return Integer.parseInt(val) * 1000;
            } catch (Exception e) {
                System.out.println(e.toString());
                return defaultValue * 1000;
            }
        }
    }
}
