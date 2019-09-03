package musicclient.endpoint;

import music.model.Track;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.List;

@RestController
@RequestMapping("/sync")
public class SyncEndpoint {

    @Value("${zuul.routes.music-api.url}")
    private String zuulRoute;

    @Value("${local.music.file.location}")
    private String localMusicFileLocation;

    @PostMapping
    public void sample(@RequestBody List<Track> tracksToSync) throws IOException {
        if (tracksToSync != null) {
            for (Track track : tracksToSync) {
                FileUtils.copyURLToFile(
                        new URL(zuulRoute + "/track/" + track.getId() + "/stream"),
                        new File(localMusicFileLocation + track.getLocation())//,
//                CONNECT_TIMEOUT,
//                READ_TIMEOUT
                );
            }
        }
    }
}
