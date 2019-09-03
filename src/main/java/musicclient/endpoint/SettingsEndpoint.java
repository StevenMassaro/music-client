package musicclient.endpoint;

import musicclient.model.impl.PublicSettings;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settings")
public class SettingsEndpoint {

    @Autowired
    private PublicSettings settings;

    @GetMapping()
    public PublicSettings getMusicFileSource(){
        return settings;
    }
}
