package musicclient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.stereotype.Component;

import java.util.Collections;

@SpringBootApplication
@ComponentScan({"music", "musicclient"})
public class MusicClient {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MusicClient.class);
        app.setDefaultProperties(Collections
            .singletonMap("server.port", "8091"));
        app.run(args);
    }

    @Component
    public class ServerPortCustomizer
        implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {

        @Override
        public void customize(ConfigurableWebServerFactory factory) {
            factory.setPort(8091);
        }
    }
}