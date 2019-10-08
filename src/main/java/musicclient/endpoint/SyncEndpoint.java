package musicclient.endpoint;

import com.google.gson.Gson;
import music.model.Track;
import musicclient.model.impl.PrivateSettings;
import musicclient.model.impl.SyncResult;
import musicclient.service.TrackService;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping("/sync")
public class SyncEndpoint {

    Logger logger = LoggerFactory.getLogger(SyncEndpoint.class);

    private final PrivateSettings settings;

    private final TrackService trackService;

    private final PrivateSettings privateSettings;

    private Gson gson = new Gson();

    private final String RENAME_SEPARATOR = "_";

    @Autowired
    public SyncEndpoint(PrivateSettings settings, TrackService trackService, PrivateSettings privateSettings) {
        this.settings = settings;
        this.trackService = trackService;
        this.privateSettings = privateSettings;
    }

    @PostMapping
    public SyncResult sample(@RequestBody List<Track> tracksToSync, HttpServletRequest request) throws IOException {
        SyncResult syncResult = new SyncResult();
        if (tracksToSync != null) {
            String serverName = request.getServerName();
            int serverPort = request.getServerPort();
            String scheme = request.getScheme();
            String contextPath = request.getContextPath();
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
                        String downloadedFileHash = calculateHash(new File(destinationPath));
                        if (downloadedFileHash.equals(track.getHash())) {
                            logger.debug(String.format("Successfully downloaded track %s, hashes match", track.getTitle()));
                            newFilesHashes.put(destinationFilename, track.getHash());
                            syncResult.incrementNewlyDownloadedFiles();
                        } else {
                            logger.error(String.format("Failed to download track %s, hashes don't match, deleting downloaded file", track.getTitle()));
                            boolean deletedSuccessfully = FileUtils.deleteQuietly(new File(destinationPath));
							if(!deletedSuccessfully) {
								logger.error(String.format("Failed to delete track %s", track.getId()));
							}
                            syncResult.addFailedDownloadedFile(track);
                        }
                    } catch (Exception e) {
                        logger.error(String.format("Failed to download track %s, deleting downloaded file", track.getTitle()), e);
                        boolean deletedSuccessfully = FileUtils.deleteQuietly(new File(destinationPath));
						if(!deletedSuccessfully) {
							logger.error(String.format("Failed to delete track %s", destinationPath));
						}
                        syncResult.addFailedDownloadedFile(track);
                    }
                }
            }
            dumpHashesToDisk(newFilesHashes);

            // delete any leftover files on disk which don't match any hash in the server
            if (!existingFilesHash.isEmpty()) {
                logger.info(String.format("Deleting %s files which do not match any existing hash", existingFilesHash.size()));
                syncResult.setUnmatchedDeletedFiles(existingFilesHash.size());
                for (Map.Entry<String, File> existingFile : existingFilesHash.entrySet()) {
                    logger.debug(String.format("Deleting %s", existingFile.getValue().getName()));
                    boolean deletedSuccessfully = FileUtils.deleteQuietly(existingFile.getValue());
					if(!deletedSuccessfully) {
						logger.error(String.format("Failed to delete track %s", existingFile.getValue()));
					}
                }
            }
        }
        syncResult.setSuccess(true);
        logger.info(syncResult.toString());
        return syncResult;
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
        Map<String, String> hashDump = loadExistingHashDump();
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
                renamedFileHash = calculateHash(existingFile);
            }
            existingFilesHash.put(renamedFileHash, existingFile);
        }
        return existingFilesHash;
    }

    private String calculateHash(File file) throws IOException {
        return DigestUtils.sha512Hex(FileUtils.openInputStream(file));
    }

    private Map<String, String> loadExistingHashDump() throws IOException {
        logger.info("Loading hash dump");
        try{
            String hashDump = FileUtils.readFileToString(getHashDumpFile(), StandardCharsets.UTF_8);
            return (Map<String, String>) gson.fromJson(hashDump, Map.class);
        } catch (FileNotFoundException e){
            logger.error("No existing hash dump found", e);
            return new HashMap<>();
        }
    }

    private void dumpHashesToDisk(Map<String, String> newFilesHashes) throws IOException {
        FileUtils.write(getHashDumpFile(), gson.toJson(newFilesHashes), StandardCharsets.UTF_8);
    }

    private File getHashDumpFile(){
        return new File(privateSettings.getLocalMusicFileLocation() + privateSettings.getHASH_DUMP_FILENAME());
    }
}
