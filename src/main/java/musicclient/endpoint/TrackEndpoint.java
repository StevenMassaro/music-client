package musicclient.endpoint;

import music.service.MetadataService;
import musicclient.service.TrackService;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.jaudiotagger.tag.datatype.Artwork;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static music.utils.EndpointUtils.responseEntity;

import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/track")
public class TrackEndpoint {

    private final TrackService trackService;

    private final MetadataService metadataService;

    public TrackEndpoint(TrackService trackService, MetadataService metadataService) {
        this.trackService = trackService;
        this.metadataService = metadataService;
    }

    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> stream(@PathVariable long id) throws IOException {
        File file = trackService.getFile(id, true);
        return responseEntity(FilenameUtils.getName(file.getAbsolutePath()),
            "audio/" + FilenameUtils.getExtension(file.getAbsolutePath()).toLowerCase(),
        FileUtils.readFileToByteArray(file));
    }

    @GetMapping("/{id}/art")
    public ResponseEntity<Resource> getAlbumArt(@PathVariable long id, @RequestParam(defaultValue = "0") Integer index) throws IOException {
        File file = trackService.getFile(id, true);
        Artwork art = metadataService.getAlbumArt(file, index);
        return responseEntity(null, art.getMimeType(), art.getBinaryData());
    }
}
