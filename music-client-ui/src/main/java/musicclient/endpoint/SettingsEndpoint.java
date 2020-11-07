package musicclient.endpoint;

import music.settings.PublicSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settings")
public class SettingsEndpoint {

    private final PublicSettings settings;

    public SettingsEndpoint(PublicSettings settings) {
        this.settings = settings;
    }

    @GetMapping()
    public PublicSettings getMusicFileSource(){
        return settings;
    }
}
