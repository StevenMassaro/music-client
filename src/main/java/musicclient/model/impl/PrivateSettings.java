package musicclient.model.impl;

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

    private final String HASH_DUMP_FILENAME = "hashes.txt";

    public String getZuulRoute() {
        return zuulRoute;
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
}
