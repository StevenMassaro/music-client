package musicclient.endpoint;

import musicclient.model.impl.PrivateSettings;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.commons.io.filefilter.WildcardFileFilter;
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
import java.util.Collection;

@RestController
@RequestMapping("/track")
public class TrackEndpoint {

    @Autowired
    private PrivateSettings settings;

    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> stream(@PathVariable long id) throws IOException {
        IOFileFilter fileFilter = new WildcardFileFilter(id + ".*");
        Collection<File> possibleFiles = FileUtils.listFiles(new File(settings.getLocalMusicFileLocation()), fileFilter, null);
        if(possibleFiles.isEmpty()){
            throw new IOException(String.format("No files found on disk that match ID %s", id));
        } else if(possibleFiles.size() > 1){
            throw new IOException(String.format("Found %s files on disk that match ID %s and expected only 1", possibleFiles.size(), id));
        } else {
            for(File file : possibleFiles){
                Resource fileResource = new InputStreamResource(FileUtils.openInputStream(file));
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + FilenameUtils.getName(file.getAbsolutePath()) + "\"")
                        .header(HttpHeaders.CONTENT_TYPE, "audio/" + FilenameUtils.getExtension(file.getAbsolutePath()).toLowerCase())
                        .body(fileResource);
            }
            return null;
        }
    }
}
