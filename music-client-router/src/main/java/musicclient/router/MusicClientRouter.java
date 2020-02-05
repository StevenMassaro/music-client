package musicclient.router;

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
public class MusicClientRouter {

    @Autowired
    private PrivateSettings privateSettings;

    private final String AUTH_HEADER_NAME = "Authorization";

    public static void main(String[] args) {
        SpringApplication.run(MusicClientRouter.class, args);
    }

    @Bean
    public RouteLocator myRoutes(RouteLocatorBuilder builder) {
        return builder.routes()
            .route(p -> p
                .path(privateSettings.getMUSIC_API_GATEWAY_ROUTE() + "/**")
                .filters(this::authHeader)
                .uri(privateSettings.getZuulRoute())
            )
            .route(p -> p
                .path(privateSettings.getMUSIC_API_GATEWAY_ROUTE() + "/gs-guide-websocket/**")
                .filters(this::authHeader)
                .uri(privateSettings.getZuulRouteWs())
            )
            .route(p -> p
                .path("/**")
                .uri("http://localhost:8091") // music-client-ui runs at 8091
            )
            .route(p -> p
                .path("/gs-guide-websocket/**")
                .uri("ws://localhost:8091") // music-client-ui runs at 8091
            )
            .build();
    }

    private GatewayFilterSpec authHeader(GatewayFilterSpec f) {
        return f.setRequestHeader(AUTH_HEADER_NAME, privateSettings.getZuulMusicAuthorizationHeader());
    }
}