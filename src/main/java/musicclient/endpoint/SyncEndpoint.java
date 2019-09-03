package musicclient.endpoint;

import music.model.Track;
import musicclient.model.impl.PrivateSettings;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.List;

@RestController
@RequestMapping("/sync")
public class SyncEndpoint {

    @Autowired
    private PrivateSettings settings;

    @PostMapping
    public void sample(@RequestBody List<Track> tracksToSync) throws IOException {
        if (tracksToSync != null) {
            for (Track track : tracksToSync) {
                FileUtils.copyURLToFile(
                        new URL(settings.getZuulRoute() + "/track/" + track.getId() + "/stream"),
                        new File(settings.getLocalMusicFileLocation() + track.getId() + "." + FilenameUtils.getExtension(track.getLocation()))//,
//                CONNECT_TIMEOUT,
//                READ_TIMEOUT
                );
            }
        }
    }
}
