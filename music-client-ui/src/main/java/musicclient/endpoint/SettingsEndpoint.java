package musicclient.endpoint;

import lombok.AllArgsConstructor;
import musicclient.settings.PublicSettings;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/settings")
@AllArgsConstructor
public class SettingsEndpoint {

    private final PublicSettings settings;

    @GetMapping
    public PublicSettings getPublicSettings(){
        return settings;
    }
}
