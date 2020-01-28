package musicclient;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan({"music", "musicclient"})
public class MusicClient {

    public static void main(String[] args) {
        SpringApplication.run(MusicClient.class, args);
    }
}