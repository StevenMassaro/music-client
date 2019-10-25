package musicclient.endpoint;

import music.model.Track;
import musicclient.model.impl.SyncResult;
import musicclient.service.SyncService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/sync")
public class SyncEndpoint {

    private final SyncService syncService;

    @Autowired
    public SyncEndpoint(SyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping
    public SyncResult sample(@RequestBody List<Track> tracksToSync, HttpServletRequest request) throws IOException {
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String scheme = request.getScheme();
        String contextPath = request.getContextPath();

        return syncService.performSync(tracksToSync, serverName, serverPort, scheme, contextPath);
    }
}
