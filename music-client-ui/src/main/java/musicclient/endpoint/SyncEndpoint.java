package musicclient.endpoint;

import lombok.AllArgsConstructor;
import music.exception.TaskInProgressException;
import music.model.Track;
import musicclient.model.impl.SyncResult;
import musicclient.service.SyncService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/sync")
@AllArgsConstructor
public class SyncEndpoint {

    private final SyncService syncService;

    @PostMapping
    public SyncResult sample(@RequestBody List<Track> tracksToSync) throws IOException, TaskInProgressException {
        return syncService.performSync(tracksToSync);
    }
}
