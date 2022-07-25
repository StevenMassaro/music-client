package musicclient.endpoint;

import lombok.AllArgsConstructor;
import music.service.MetadataService;
import musicclient.service.TrackService;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.jaudiotagger.tag.datatype.Artwork;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

import static music.utils.EndpointUtils.responseEntity;

@RestController
@RequestMapping("/track")
@AllArgsConstructor
public class TrackEndpoint {

    private final TrackService trackService;
    private final MetadataService metadataService;

    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> stream(@PathVariable long id) throws IOException {
        File file = trackService.getFile(id, true);

        String mimeType = Files.probeContentType(file.toPath());

        HttpHeaders header = new HttpHeaders();
        header.add(HttpHeaders.CONTENT_TYPE, mimeType);
        header.add(HttpHeaders.CONTENT_DISPOSITION, "attachment;filename=\"" + file.getName() + "\"");
        header.add("Cache-Control", "no-cache, no-store, must-revalidate");
        header.add("Pragma", "no-cache");
        header.add("Expires", "0");

        return ResponseEntity.ok()
            .headers(header)
            .contentLength(file.length())
            .contentType(MediaType.parseMediaType(mimeType))
            .body(new FileSystemResource(file));
    }

    @GetMapping("/{id}/art")
    public ResponseEntity<Resource> getAlbumArt(@PathVariable long id, @RequestParam(defaultValue = "0") Integer index) throws IOException {
        File file = trackService.getFile(id, true);
        Artwork art = metadataService.getAlbumArt(file, index);
        return responseEntity(null, art.getMimeType(), art.getBinaryData());
    }
}
