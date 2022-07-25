package musicclient.settings;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
public class PublicSettings {

    @Value("${music.file.source}")
    private String musicFileSource;

    @Value("${device.name}")
    private String deviceName;

    /**
     * The URL of the main server.
     */
    @Value("${zuul.routes.music-api.url}")
    private String serverApiUrl;

    /**
     * The auth header to be used when making calls to the main server.
     */
    @Value("${zuul.music-api.authorizationHeader}")
    private String serverApiAuthHeader;
}
