package music.settings;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PublicSettings {

    @Value("${music.file.source}")
    private String musicFileSource;

    @Value("${device.name}")
    private String deviceName;

    @Value("${zuul.routes.music-api.url}")
    private String serverApiUrl;

    @Value("${zuul.music-api.authorizationHeader}")
    private String serverApiAuthHeader;

    public String getMusicFileSource() {
        return musicFileSource.toLowerCase();
    }

    public String getDeviceName() {
        return deviceName;
    }

    /**
     * @return The URL of the main server.
     */
    public String getServerApiUrl() {
        return serverApiUrl;
    }

    /**
     * @return The auth header to be used when making calls to the main server.
     */
    public String getServerApiAuthHeader() {
        return serverApiAuthHeader;
    }
}
