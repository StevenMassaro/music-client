package music.settings;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PrivateSettings {

    @Value("${zuul.routes.music-api.url}")
    private String zuulRoute;

    @Value("${local.music.file.location}")
    private String localMusicFileLocation;

    @Value("${zuul.music-api.authorizationHeader}")
    private String zuulMusicAuthorizationHeader;

    @Value("${sync.connect_timeout}")
    private String connectTimeout;

    @Value("${sync.read_timeout}")
    private String readTimeout;

    private final String HASH_DUMP_FILENAME = "hashes.txt";

    public String getZuulRoute() {
        return zuulRoute;
    }

    public String getZuulRouteWs() {
        if(zuulRoute.contains("http://")){
            return "ws://" + zuulRoute.replaceFirst("http://", "");
        } else if (zuulRoute.contains("https://")){
            return "wss://" + zuulRoute.replaceFirst("https://", "");
        } else {
            return "ws://" + zuulRoute.replaceFirst("http://", "");
        }
    }

    public void setZuulRoute(String zuulRoute) {
        this.zuulRoute = zuulRoute;
    }

    public String getLocalMusicFileLocation() {
        return localMusicFileLocation;
    }

    public void setLocalMusicFileLocation(String localMusicFileLocation) {
        this.localMusicFileLocation = localMusicFileLocation;
    }

    public String getZuulMusicAuthorizationHeader() {
        return zuulMusicAuthorizationHeader;
    }

    public void setZuulMusicAuthorizationHeader(String zuulMusicAuthorizationHeader) {
        this.zuulMusicAuthorizationHeader = zuulMusicAuthorizationHeader;
    }

    public String getHASH_DUMP_FILENAME() {
        return HASH_DUMP_FILENAME;
    }

    public int getConnectTimeout() {
        return tryParseInt(connectTimeout, 15, 1000);
    }

    public int getReadTimeout() {
        return tryParseInt(readTimeout, 60, 1000);
    }

    private int tryParseInt(String val, int defaultValue, int multiplier) {
        try {
            return Integer.parseInt(val) * multiplier;
        } catch (Exception e) {
            System.out.println(e.toString());
            return defaultValue * multiplier;
        }
    }
}
