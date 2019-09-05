package musicclient.endpoint;

import musicclient.service.TrackService;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/track")
public class TrackEndpoint {

    @Autowired
    private TrackService trackService;

    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> stream(@PathVariable long id) throws IOException {
        File file = trackService.getFile(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + FilenameUtils.getName(file.getAbsolutePath()) + "\"")
                .header(HttpHeaders.CONTENT_TYPE, "audio/" + FilenameUtils.getExtension(file.getAbsolutePath()).toLowerCase())
                .body(new InputStreamResource(FileUtils.openInputStream(file)));

    }
}
