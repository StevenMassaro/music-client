package musicclient;

import music.settings.PrivateSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan({"music", "musicclient"})
public class MusicClient {

    @Autowired
    private PrivateSettings privateSettings;

    public static void main(String[] args) {
        SpringApplication.run(MusicClient.class, args);
    }

    @Bean
    public RouteLocator myRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route(p -> p
                .path("/music-api/**")
                .filters(f ->
                    f.addRequestHeader("Authorization", privateSettings.getZuulMusicAuthorizationHeader())
                        .rewritePath("/music-api", "")
                )
                .uri(privateSettings.getZuulRoute())
            )
            .route(p -> p
                .path("/gs-guide-websocket/info/**")
                .filters(f ->
                    f.addRequestHeader("Authorization", privateSettings.getZuulMusicAuthorizationHeader())
                )
                .uri(privateSettings.getZuulRoute())
            )
            .route(p -> p
                .path("/gs-guide-websocket/**")
                .filters(f ->
                    f.addRequestHeader("Authorization", privateSettings.getZuulMusicAuthorizationHeader())
                )
                .uri(privateSettings.getZuulRouteWs())
            )
            .build();
    }
}