package musicclient;

import musicclient.model.impl.SyncStep;
import musicclient.model.impl.SyncUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class SyncWebsocket {

    private final Logger logger = LoggerFactory.getLogger(SyncWebsocket.class);

    @Autowired
    private final SimpMessagingTemplate simpMessagingTemplate;

    private static final String SYNC_UPDATE_DESTINATION = "/topic/sync/updates";

    public SyncWebsocket(SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    public void sendSyncUpdateMessage(int position, int max, SyncStep syncStep) {
        SyncUpdate syncUpdate = new SyncUpdate(position + 1, max, syncStep);
        logger.trace("Sending {}", syncUpdate);
        simpMessagingTemplate.convertAndSend(SYNC_UPDATE_DESTINATION, syncUpdate);
    }
}
