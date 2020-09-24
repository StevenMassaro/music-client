package music.settings;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PrivateSettings {

    @Value("${local.music.file.location:#{null}}")
    private String localMusicFileLocation;

    @Value("${zuul.music-api.authorizationHeader}")
    private String zuulMusicAuthorizationHeader;

    @Value("${sync.connect_timeout:#{15}}")
    private String connectTimeout;

    @Value("${sync.read_timeout:#{60}}")
    private String readTimeout;

    private final String HASH_DUMP_FILENAME = "hashes.txt";

    public String getLocalMusicFileLocation() {
        return localMusicFileLocation;
    }

    public String getZuulMusicAuthorizationHeader() {
        return zuulMusicAuthorizationHeader;
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
