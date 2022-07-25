package musicclient.model.impl;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import music.model.Track;

import java.util.Collections;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
public class SyncResult {

    private long totalFiles = 0;
    private long existingFiles = 0;
    private long newlyDownloadedFiles = 0;
    private List<Track> failedDownloadedFiles = new ArrayList<>();
    private long unmatchedDeletedFiles = 0;
    private boolean success = false;

    @JsonIgnore
    public void incrementExistingFiles() {
        existingFiles = existingFiles + 1;
    }

    @JsonIgnore
    public void incrementNewlyDownloadedFiles() {
        newlyDownloadedFiles = newlyDownloadedFiles + 1;
    }

    @JsonIgnore
    public void addFailedDownloadedFile(Track track) {
        failedDownloadedFiles.add(track);
    }

    @JsonIgnore
    public void incrementUnmatchedDeletedFiles() {
        unmatchedDeletedFiles = unmatchedDeletedFiles + 1;
    }

    /**
     * Custom override for Jackson.
     */
    public boolean isSuccess() {
        if (failedDownloadedFiles.size() > 0) {
            return false;
        } else {
            return success;
        }
    }
}
