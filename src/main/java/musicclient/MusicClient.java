package musicclient;

import musicclient.filters.BasicAuthorizationHeaderFilter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.zuul.EnableZuulProxy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;

@EnableZuulProxy
@SpringBootApplication
@ComponentScan({"music", "musicclient"})
public class MusicClient {

    public static void main(String[] args) {
        SpringApplication.run(MusicClient.class, args);
    }

    @Bean
    public BasicAuthorizationHeaderFilter basicAuthorizationHeaderFilter() {
        return new BasicAuthorizationHeaderFilter();
    }
}