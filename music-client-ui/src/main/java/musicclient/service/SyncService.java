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
				long currentTime = new Date().getTime();

				// rename all existing files
				renameExistingFiles(syncResult, tracksToSync, currentTime);

				Map<String, File> existingFilesHash = determineExistingFilesHashes(currentTime);

                AtomicInteger trackIndex = new AtomicInteger(-1);
                syncWebsocket.sendSyncUpdateMessage(trackIndex.get(), tracksToSync.size(), SyncStep.SYNCING);
				Map<String, String> newFilesHashes = new ConcurrentHashMap<>();
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
				hashService.dumpHashesToDisk(newFilesHashes);
				// after generating the new hash dump, reload the cache
				trackService.clearCacheFromHashDump();
				trackService.buildCacheFromHashDump();

				// delete any leftover files on disk which don't match any hash in the server
				if (!existingFilesHash.isEmpty()) {
					log.info("Deleting {} files which do not match any existing hash", existingFilesHash.size());
					syncResult.setUnmatchedDeletedFiles(existingFilesHash.size());
					for (Map.Entry<String, File> existingFile : existingFilesHash.entrySet()) {
						log.debug("Deleting {}", existingFile.getValue().getName());
						boolean deletedSuccessfully = FileUtils.deleteQuietly(existingFile.getValue());
						if (!deletedSuccessfully) {
							log.error("Failed to delete track {}", existingFile.getValue());
						}
					}
				}
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

    private void renameExistingFiles(SyncResult syncResult, List<Track> tracksToSync, long currentTime) throws IOException {
        log.info("Renaming existing files on disk");
        Collection<File> existingFiles = trackService.listFiles();
        syncResult.setTotalFiles(tracksToSync.size());
        long existingFileCount = 0;
        syncWebsocket.sendSyncUpdateMessage(-1, tracksToSync.size(), SyncStep.RENAMING_EXISTING);
        for (File existingFile : existingFiles) {
            syncWebsocket.sendSyncUpdateMessage((int) existingFileCount, tracksToSync.size(), SyncStep.RENAMING_EXISTING);
            existingFileCount++;
            String newName = currentTime + RENAME_SEPARATOR + existingFile.getName();
            log.debug("Renaming track {} of {} from {} to {}", existingFileCount, existingFiles.size(), existingFile.getName(), newName);
            if (existingFileCount % 100 == 0) {
                log.info("Renamed {} of a total of {} files", existingFileCount, existingFiles.size());
            }
            File renamedFile = new File(Objects.requireNonNull(localMusicFileLocation) + newName);
            FileUtils.moveFile(existingFile, renamedFile);
        }
    }

    private Map<String, File> determineExistingFilesHashes(long currentTime) throws IOException {
        Map<String, File> existingFilesHash = new ConcurrentHashMap<>();
        Map<String, String> hashDump = hashService.loadExistingHashDump();
        Collection<File> existingFiles = trackService.listFiles();
        AtomicInteger existingFileCount = new AtomicInteger(0);
        syncWebsocket.sendSyncUpdateMessage(-1, existingFiles.size(), SyncStep.HASHING_EXISTING);
        existingFiles.parallelStream().forEach((existingFile) -> {
            syncWebsocket.sendSyncUpdateMessage(existingFileCount.get(), existingFiles.size(), SyncStep.HASHING_EXISTING);
            existingFileCount.incrementAndGet();
            log.debug("Hashing {} of {}: {}", existingFileCount, existingFiles.size(), existingFile.getName());
            if (existingFileCount.get() % 100 == 0) {
                log.info("Hashed {} of a total of {} files", existingFileCount, existingFiles.size());
            }
            String originalFileName = existingFile.getName().replace(currentTime + "_", "");
            String renamedFileHash = null;
            if (hashDump.containsKey(originalFileName)) {
                log.debug("Hash dump contains hash for existing file {}, loading instead of recalculating", existingFile.getName());
                renamedFileHash = hashDump.get(originalFileName);
            } else {
                log.debug("Hash dump does not contain hash for existing file {}, calculating hash", existingFile.getName());
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
