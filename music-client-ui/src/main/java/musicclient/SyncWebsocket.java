package musicclient;

import lombok.extern.log4j.Log4j2;
import musicclient.model.impl.SyncStep;
import musicclient.model.impl.SyncUpdate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@Log4j2
public class SyncWebsocket {

    @Autowired
    private final SimpMessagingTemplate simpMessagingTemplate;

    private static final String SYNC_UPDATE_DESTINATION = "/topic/sync/updates";

    public SyncWebsocket(SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    public void sendSyncUpdateMessage(int position, int max, SyncStep syncStep) {
        SyncUpdate syncUpdate = new SyncUpdate(position + 1, max, syncStep);
        log.trace("Sending {}", syncUpdate);
        simpMessagingTemplate.convertAndSend(SYNC_UPDATE_DESTINATION, syncUpdate);
    }
}
