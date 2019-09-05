package musicclient.endpoint;

import music.model.Track;
import musicclient.model.impl.PrivateSettings;
import musicclient.service.TrackService;
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
import java.util.List;

@RestController
@RequestMapping("/sync")
public class SyncEndpoint {

    Logger logger = LoggerFactory.getLogger(SyncEndpoint.class);

    @Autowired
    private PrivateSettings settings;

    @Autowired
    private TrackService trackService;

    @PostMapping
    public void sample(@RequestBody List<Track> tracksToSync, HttpServletRequest request) throws IOException {
        if (tracksToSync != null) {
            String serverName = request.getServerName();
            int serverPort = request.getServerPort();
            String scheme = request.getScheme();
            String contextPath = request.getContextPath();
            for (int i = 0; i < tracksToSync.size(); i++) {
                Track track = tracksToSync.get(i);
                if(trackService.doesFileExist(track.getId())){
                    logger.info(String.format("Track %s of %s already exists on disk (ID: %s)", (i + 1), tracksToSync.size(), track.getId()));
                } else {
                    logger.info(String.format("Syncing track %s of %s to disk (ID: %s)", (i + 1), tracksToSync.size(), track.getId()));
                    String url = scheme + "://" + serverName + ":" + serverPort +
                            contextPath + "/music-api/track/" + track.getId() + "/stream";
                    String destinationPath = settings.getLocalMusicFileLocation() + track.getId() + "." + FilenameUtils.getExtension(track.getLocation());
                    logger.debug(String.format("URL: %s", url));
                    logger.debug(String.format("Destination path: %s", destinationPath));
                    FileUtils.copyURLToFile(
                            new URL(url),
                            new File(destinationPath)//,
//                CONNECT_TIMEOUT,
//                READ_TIMEOUT
                    );
                }
            }
        }
    }
}
