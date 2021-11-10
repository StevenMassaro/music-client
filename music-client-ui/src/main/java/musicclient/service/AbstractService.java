package musicclient.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public abstract class AbstractService {
    @Value("${local.music.file.location}")
    protected String localMusicFileLocation;
}
