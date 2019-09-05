package musicclient.model.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class PublicSettings {

    @Value("${music.file.source}")
    private String musicFileSource;

    public String getMusicFileSource() {
        return musicFileSource.toLowerCase();
    }

    public void setMusicFileSource(String musicFileSource) {
        this.musicFileSource = musicFileSource.toLowerCase();
    }
}
