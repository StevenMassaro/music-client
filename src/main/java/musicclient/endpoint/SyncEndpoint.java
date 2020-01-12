package musicclient.endpoint;

import music.exception.TaskInProgressException;
import music.model.Track;
import musicclient.model.impl.SyncResult;
import musicclient.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/sync")
public class SyncEndpoint {

    private final SyncService syncService;

    @Autowired
    Environment environment;

    @Autowired
    public SyncEndpoint(SyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping
    public SyncResult sample(@RequestBody List<Track> tracksToSync) throws IOException, TaskInProgressException {
        String serverPort = environment.getProperty("local.server.port");

        return syncService.performSync(tracksToSync, serverPort);
    }
}
