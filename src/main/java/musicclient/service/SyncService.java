package musicclient.service;

import music.exception.TaskInProgressException;
import music.model.Track;
import music.settings.PrivateSettings;
import musicclient.model.impl.SyncResult;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class SyncService {
    Logger logger = LoggerFactory.getLogger(SyncService.class);
	private AtomicBoolean currentlySyncing = new AtomicBoolean(false);

    private final PrivateSettings settings;

    private final TrackService trackService;

    private final HashService hashService;

    private final String RENAME_SEPARATOR = "_";

    public SyncService(PrivateSettings settings, TrackService trackService, HashService hashService) {
        this.settings = settings;
        this.trackService = trackService;
        this.hashService = hashService;
    }

    public SyncResult performSync(List<Track> tracksToSync, String serverName, int serverPort, String scheme, String contextPath) throws IOException, TaskInProgressException {
		checkNotSyncing();
		try {
			currentlySyncing.set(true);
			SyncResult syncResult = new SyncResult();
			if (tracksToSync != null) {
				long currentTime = new Date().getTime();

				// rename all existing files
				renameExistingFiles(syncResult, tracksToSync, currentTime);

				Map<String, File> existingFilesHash = determineExistingFilesHashes(currentTime);
				Map<String, String> newFilesHashes = new HashMap<>();
				// find existing files which match the hashes of files to sync, otherwise download the file from the server
				for (int i = 0; i < tracksToSync.size(); i++) {
					Track track = tracksToSync.get(i);
					String destinationFilename = track.getId() + "." + FilenameUtils.getExtension(track.getLocation());
					String destinationPath = settings.getLocalMusicFileLocation() + destinationFilename;
					File existingFile = existingFilesHash.get(track.getHash());
					if (existingFile != null) {
						logger.info(String.format("Track %s of %s already exists on disk (ID: %s)", (i + 1), tracksToSync.size(), track.getId()));
						FileUtils.moveFile(existingFile, new File(destinationPath));
						existingFilesHash.remove(track.getHash());
						newFilesHashes.put(destinationFilename, track.getHash());
						syncResult.incrementExistingFiles();
					} else {
						logger.info(String.format("Syncing track %s of %s to disk (ID: %s)", (i + 1), tracksToSync.size(), track.getId()));
						String url = scheme + "://" + serverName + ":" + serverPort +
							contextPath + "/music-api/track/" + track.getId() + "/stream";
						logger.debug(String.format("URL: %s", url));
						logger.debug(String.format("Destination path: %s", destinationPath));
						try {
							FileUtils.copyURLToFile(
								new URL(url),
								new File(destinationPath)//,
//                CONNECT_TIMEOUT,
//                READ_TIMEOUT
							);
							// ensure downloaded file matches expected
							String downloadedFileHash = hashService.calculateHash(new File(destinationPath));
							if (downloadedFileHash.equals(track.getHash())) {
								logger.debug(String.format("Successfully downloaded track %s, hashes match", track.getTitle()));
								newFilesHashes.put(destinationFilename, track.getHash());
								syncResult.incrementNewlyDownloadedFiles();
							} else {
								logger.error(String.format("Failed to download track %s, hashes don't match, deleting downloaded file", track.getTitle()));
								boolean deletedSuccessfully = FileUtils.deleteQuietly(new File(destinationPath));
								if (!deletedSuccessfully) {
									logger.error(String.format("Failed to delete track %s", track.getId()));
								}
								syncResult.addFailedDownloadedFile(track);
							}
						} catch (Exception e) {
							logger.error(String.format("Failed to download track %s, deleting downloaded file", track.getTitle()), e);
							boolean deletedSuccessfully = FileUtils.deleteQuietly(new File(destinationPath));
							if (!deletedSuccessfully) {
								logger.error(String.format("Failed to delete track %s", destinationPath));
							}
							syncResult.addFailedDownloadedFile(track);
						}
					}
				}
				hashService.dumpHashesToDisk(newFilesHashes);
				// after generating the new hash dump, reload the cache
				trackService.clearCacheFromHashDump();
				trackService.buildCacheFromHashDump();

				// delete any leftover files on disk which don't match any hash in the server
				if (!existingFilesHash.isEmpty()) {
					logger.info(String.format("Deleting %s files which do not match any existing hash", existingFilesHash.size()));
					syncResult.setUnmatchedDeletedFiles(existingFilesHash.size());
					for (Map.Entry<String, File> existingFile : existingFilesHash.entrySet()) {
						logger.debug(String.format("Deleting %s", existingFile.getValue().getName()));
						boolean deletedSuccessfully = FileUtils.deleteQuietly(existingFile.getValue());
						if (!deletedSuccessfully) {
							logger.error(String.format("Failed to delete track %s", existingFile.getValue()));
						}
					}
				}
			}
			syncResult.setSuccess(true);
			logger.info(syncResult.toString());
			currentlySyncing.set(false);
			return syncResult;
		} catch (Exception e) {
			currentlySyncing.set(false);
			throw e;
		}
    }

    private void renameExistingFiles(SyncResult syncResult, List<Track> tracksToSync, long currentTime) throws IOException {
        logger.info("Renaming existing files on disk");
        Collection<File> existingFiles = trackService.listFiles();
        syncResult.setTotalFiles(tracksToSync.size());
        long existingFileCount = 0;
        for (File existingFile : existingFiles) {
            existingFileCount++;
            String newName = currentTime + RENAME_SEPARATOR + existingFile.getName();
            logger.debug(String.format("Renaming track %s of %s from %s to %s", existingFileCount, existingFiles.size(), existingFile.getName(), newName));
            if (existingFileCount % 100 == 0) {
                logger.info(String.format("Renamed %s of a total of %s files", existingFileCount, existingFiles.size()));
            }
            File renamedFile = new File(settings.getLocalMusicFileLocation() + newName);
            FileUtils.moveFile(existingFile, renamedFile);
        }
    }

    private Map<String, File> determineExistingFilesHashes(long currentTime) throws IOException {
        Map<String, File> existingFilesHash = new HashMap<>();
        Map<String, String> hashDump = hashService.loadExistingHashDump();
        Collection<File> existingFiles = trackService.listFiles();
        long existingFileCount = 0;
        for (File existingFile : existingFiles) {
            existingFileCount++;
            logger.debug(String.format("Hashing %s of %s: %s", existingFileCount, existingFiles.size(), existingFile.getName()));
            if (existingFileCount % 100 == 0) {
                logger.info(String.format("Hashed %s of a total of %s files", existingFileCount, existingFiles.size()));
            }
            String originalFileName = existingFile.getName().replace(currentTime + "_", "");
            String renamedFileHash;
            if (hashDump.containsKey(originalFileName)) {
                logger.debug(String.format("Hash dump contains hash for existing file %s, loading instead of recalculating", existingFile.getName()));
                renamedFileHash = hashDump.get(originalFileName);
            } else {
                logger.debug(String.format("Hash dump does not contain hash for existing file %s, calculating hash", existingFile.getName()));
                renamedFileHash = hashService.calculateHash(existingFile);
            }
            existingFilesHash.put(renamedFileHash, existingFile);
        }
        return existingFilesHash;
    }

	private void checkNotSyncing() throws TaskInProgressException {
		if (currentlySyncing.get()) {
			throw new TaskInProgressException("sync");
		}
	}
}
