package musicclient.endpoint;

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
import java.io.IOException;
import java.net.URL;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/sync")
public class SyncEndpoint {

    Logger logger = LoggerFactory.getLogger(SyncEndpoint.class);

    private final PrivateSettings settings;

    private final TrackService trackService;

    @Autowired
    public SyncEndpoint(PrivateSettings settings, TrackService trackService) {
        this.settings = settings;
        this.trackService = trackService;
    }

    @PostMapping
    public SyncResult sample(@RequestBody List<Track> tracksToSync, HttpServletRequest request) throws IOException {
        SyncResult syncResult = new SyncResult();
        if (tracksToSync != null) {
            String serverName = request.getServerName();
            int serverPort = request.getServerPort();
            String scheme = request.getScheme();
            String contextPath = request.getContextPath();
            Map<String, File> existingFilesHash = new HashMap<>();

            // rename all existing files, find their hashes
            logger.info("Renaming existing files on disk, and calculating hashes");
            Collection<File> existingFiles = trackService.listFiles();
            syncResult.setTotalFiles(tracksToSync.size());
            long existingFileCount = 0;
            for (File existingFile : existingFiles) {
                existingFileCount++;
                logger.debug(String.format("Renaming %s to _%s", existingFile.getName(), existingFile.getName()));
                if (existingFileCount % 100 == 0) {
                    logger.info(String.format("Renamed %s of a total of %s files", existingFileCount, existingFiles.size()));
                }
                File renamedFile = new File(settings.getLocalMusicFileLocation() + "_" + existingFile.getName());
                FileUtils.moveFile(existingFile, renamedFile);
                String renamedFileHash = DigestUtils.sha512Hex(FileUtils.readFileToByteArray(renamedFile));
                existingFilesHash.put(renamedFileHash, renamedFile);
            }

            // find existing files which match the hashes of files to sync, otherwise download the file from the server
            for (int i = 0; i < tracksToSync.size(); i++) {
                Track track = tracksToSync.get(i);
                String destinationPath = settings.getLocalMusicFileLocation() + track.getId() + "." + FilenameUtils.getExtension(track.getLocation());
                File existingFile = existingFilesHash.get(track.getHash());
                if (existingFile != null) {
                    logger.info(String.format("Track %s of %s already exists on disk (ID: %s)", (i + 1), tracksToSync.size(), track.getId()));
                    FileUtils.moveFile(existingFile, new File(destinationPath));
                    existingFilesHash.remove(track.getHash());
                    syncResult.incrementExistingFiles();
                } else {
                    logger.info(String.format("Syncing track %s of %s to disk (ID: %s)", (i + 1), tracksToSync.size(), track.getId()));
                    String url = scheme + "://" + serverName + ":" + serverPort +
                            contextPath + "/music-api/track/" + track.getId() + "/stream";
                    logger.debug(String.format("URL: %s", url));
                    logger.debug(String.format("Destination path: %s", destinationPath));
                    FileUtils.copyURLToFile(
                            new URL(url),
                            new File(destinationPath)//,
//                CONNECT_TIMEOUT,
//                READ_TIMEOUT
                    );
                    syncResult.incrementNewlyDownloadedFiles();
                }
            }

            // delete any leftover files on disk which don't match any hash in the server
            if (!existingFilesHash.isEmpty()) {
                logger.info(String.format("Deleting %s files which do not match any existing hash", existingFilesHash.size()));
                syncResult.setUnmatchedDeletedFiles(existingFilesHash.size());
                for (Map.Entry<String, File> existingFile : existingFilesHash.entrySet()) {
                    logger.debug(String.format("Deleting %s", existingFile.getValue().getName()));
                    FileUtils.forceDelete(existingFile.getValue());
                }
            }
        }
        syncResult.setSuccess(true);
        logger.info(syncResult.toString());
        return syncResult;
    }
}
