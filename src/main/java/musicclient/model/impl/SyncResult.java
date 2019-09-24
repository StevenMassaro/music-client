package musicclient.model.impl;

import com.fasterxml.jackson.annotation.JsonIgnore;
import music.model.Track;

import java.util.Collections;
import java.util.ArrayList;
import java.util.List;

public class SyncResult {

    private long totalFiles = 0;
    private long existingFiles = 0;
    private long newlyDownloadedFiles = 0;
    private List<Track> failedDownloadedFiles = new ArrayList<>();
    private long unmatchedDeletedFiles = 0;
    private boolean success = false;

    public long getTotalFiles() {
        return totalFiles;
    }

    public void setTotalFiles(long totalFiles) {
        this.totalFiles = totalFiles;
    }

    public long getExistingFiles() {
        return existingFiles;
    }

    @JsonIgnore
    public void incrementExistingFiles() {
        existingFiles = existingFiles + 1;
    }

    public long getNewlyDownloadedFiles() {
        return newlyDownloadedFiles;
    }

    @JsonIgnore
    public void incrementNewlyDownloadedFiles() {
        newlyDownloadedFiles = newlyDownloadedFiles + 1;
    }

    public List<Track> getFailedDownloadedFiles() {
        return failedDownloadedFiles;
    }

    @JsonIgnore
    public void addFailedDownloadedFile(Track track) {
        failedDownloadedFiles.add(track);
    }

    public long getUnmatchedDeletedFiles() {
        return unmatchedDeletedFiles;
    }

    public void setUnmatchedDeletedFiles(long unmatchedDeletedFiles) {
        this.unmatchedDeletedFiles = unmatchedDeletedFiles;
    }

    public boolean isSuccess() {
        if (failedDownloadedFiles.size() > 0) {
            return false;
        } else {
            return success;
        }
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    @Override
    public String toString() {
        return "SyncResult{" +
                "totalFiles=" + totalFiles +
                ", existingFiles=" + existingFiles +
                ", newlyDownloadedFiles=" + newlyDownloadedFiles +
                ", failedDownloadedFiles=" + failedDownloadedFiles +
                ", unmatchedDeletedFiles=" + unmatchedDeletedFiles +
                ", success=" + success +
                '}';
    }
}
