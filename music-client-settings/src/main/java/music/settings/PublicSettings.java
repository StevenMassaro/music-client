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
}
