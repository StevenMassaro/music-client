package musicclient.model.impl;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class SyncResult {

    private long totalFiles = 0;
    private long existingFiles = 0;
    private long newlyDownloadedFiles = 0;
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

    public long getUnmatchedDeletedFiles() {
        return unmatchedDeletedFiles;
    }

    public void setUnmatchedDeletedFiles(long unmatchedDeletedFiles) {
        this.unmatchedDeletedFiles = unmatchedDeletedFiles;
    }

    public boolean isSuccess() {
        return success;
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
                ", unmatchedDeletedFiles=" + unmatchedDeletedFiles +
                ", success=" + success +
                '}';
    }
}
