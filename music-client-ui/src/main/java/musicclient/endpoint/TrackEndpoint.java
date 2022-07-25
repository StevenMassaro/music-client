package musicclient.endpoint;

import lombok.AllArgsConstructor;
import music.service.MetadataService;
import musicclient.service.TrackService;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.jaudiotagger.tag.datatype.Artwork;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<StreamingResponseBody> stream(@PathVariable long id, final HttpServletResponse response) throws IOException {
        File file = trackService.getFile(id, true);

        String mimeType = Files.probeContentType(file.toPath());
        response.setContentType(mimeType);
        response.setHeader(
            "Content-Disposition",
            "attachment;filename=" + file.getName());

        StreamingResponseBody stream = out -> IOUtils.copy(FileUtils.openInputStream(file), response.getOutputStream());

        return new ResponseEntity<>(stream, HttpStatus.OK);
    }

    @GetMapping("/{id}/art")
    public ResponseEntity<Resource> getAlbumArt(@PathVariable long id, @RequestParam(defaultValue = "0") Integer index) throws IOException {
        File file = trackService.getFile(id, true);
        Artwork art = metadataService.getAlbumArt(file, index);
        return responseEntity(null, art.getMimeType(), art.getBinaryData());
    }
}
