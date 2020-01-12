package musicclient;

import music.settings.PrivateSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.GatewayFilterSpec;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan({"music", "musicclient"})
public class MusicClient {

    @Autowired
    private PrivateSettings privateSettings;

    private final String AUTH_HEADER_NAME = "Authorization";

    public final static String MUSIC_API_GATEWAY_ROUTE = "/Music";

    public static void main(String[] args) {
        SpringApplication.run(MusicClient.class, args);
    }

    @Bean
    public RouteLocator myRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route(p -> p
                .path(MUSIC_API_GATEWAY_ROUTE + "/**")
                .filters(this::authHeader)
                .uri(privateSettings.getZuulRoute())
            )
            .route(p -> p
                .path(MUSIC_API_GATEWAY_ROUTE + "/gs-guide-websocket/**")
                .filters(this::authHeader)
                .uri(privateSettings.getZuulRouteWs())
            )
            .build();
    }

    private GatewayFilterSpec authHeader(GatewayFilterSpec f) {
        return f.setRequestHeader(AUTH_HEADER_NAME, privateSettings.getZuulMusicAuthorizationHeader());
    }
}