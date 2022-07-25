package musicclient.service;

import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.filefilter.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

@Service
@Log4j2
@AllArgsConstructor
public class TrackService extends AbstractService {

    private final HashService hashService;

    private final static Map<Long, String> hashDumpCache = new HashMap<>();

    /**
     * Get a file if you know the exact name (including extension) of the file.
     */
    public File getFileByName(String name) {
        return new File(localMusicFileLocation + name);
    }

    /**
     * Returns the first file found that matches the supplied ID with any extension. Throws exceptions if more than one
     * file is found or no matching files are found.
     * @return the matching file if found
     * @throws IOException when no files are found or too many files are found
     */
    public File getFile(long id) throws IOException {
        return getFile(id, false);
    }

    /**
     * Returns the first file found that matches the supplied ID with any extension. Throws exceptions if more than one
     * file is found or no matching files are found.
     * @param useHashDump if true, the filename is determined by looking at the hash dump created by the sync
     *                    process. if false, the first file whose name matches the id is returned
     * @return the matching file if found
     * @throws IOException when no files are found or too many files are found
     */
    public File getFile(long id, boolean useHashDump) throws IOException {
        if (useHashDump) {
            return getFileFromHashDumpCache(id);
        } else {
            Collection<File> possibleFiles = listFiles(id);
            if (possibleFiles.isEmpty()) {
                throw new IOException(String.format("No files found on disk that match ID %s", id));
            } else if (possibleFiles.size() > 1) {
                throw new IOException(String.format("Found %s files on disk that match ID %s and expected only 1", possibleFiles.size(), id));
            } else {
                for (File file : possibleFiles) {
                    return file;
                }
                return null;
            }
        }
    }

    /**
     * Determine if a file that matches the supplied ID with any extension exists in music directory.
     * @return true if a matching file is found
     */
    public boolean doesFileExist(long id) {
        return !listFiles(id).isEmpty();
    }

    /**
     * List the files found in the music file location that match the supplied ID with any extension.
     * @return list of files found that match the supplied ID, or an empty collection if no files are found
     */
    private Collection<File> listFiles(long id){
        log.debug("Begin listing filtered files (ID: {})", id);
        IOFileFilter fileFilter = new WildcardFileFilter(id + ".*");
        Collection<File> files = FileUtils.listFiles(new File(localMusicFileLocation), fileFilter, null);
        log.debug("Finish listing filtered files (ID: {})", id);
        return files;
    }

    /**
     * Get a file from the hash dump. This is deprecated because it loads the hash dump every time the method is called,
     * instead of caching the hash dump, which rarely changes.
     */
    @Deprecated
    private File getFileFromHashDump(long id) throws IOException {
        log.debug("Begin finding file from hash dump (ID: {})", id);
        Map<String, String> files = hashService.loadExistingHashDump();
        for (Map.Entry<String, String> file : files.entrySet()) {
            if (FilenameUtils.removeExtension(file.getKey()).equals(Long.toString(id))) {
                log.debug("Finish finding file from hash dump (ID: {})", id);
                return new File(localMusicFileLocation + file.getKey());
            }
        }
        return null;
    }

    /**
     * Get a file from the hash dump cache. If the hash dump cache is not loaded, it first loads it, and then looks
     * for the file.
     * @return If the file is not in the hash dump, null is returned.
     */
    private File getFileFromHashDumpCache(long id) throws IOException {
        return getFileFromHashDumpCache(id, true);
    }

    /**
     * Get a file from the hash dump cache.
     * @param shouldTryToLoadCache if true, and the hash dump cache is empty, the hash dump is first loaded, the cache
     *                             built, and then the file is searched for.
     * @return If the file is not in the hash dump, null is returned.
     */
    private File getFileFromHashDumpCache(long id, boolean shouldTryToLoadCache) throws IOException {
        if (!hashDumpCache.isEmpty()) {
            String filename = hashDumpCache.get(id);
            if (StringUtils.isNotEmpty(filename)) {
                log.trace("Loaded {} without reloading cache dump", id);
                return new File(localMusicFileLocation + filename);
            } else {
                log.error("Could not find {} in the cached hash dump", id);
                return null;
            }
        } else {
            log.trace("Cached hash dump is empty");
            // if the cache isn't loaded, and we haven't tried to load it yet, try loading it
            if (shouldTryToLoadCache) {
                log.trace("Reloading cached hash dump");
                buildCacheFromHashDump();
                return getFileFromHashDumpCache(id, false);
            } else {
                log.error("Not reloading cached hash dump for file {}, attempting to load without using hash dump", id);
                return getFile(id, false);
            }
        }
    }

    /**
     * List all files in the local music file location, except the hash dump file.
     */
    public Collection<File> listFiles(){
        IOFileFilter hashDumpFileFilter = new NameFileFilter(HashService.HASH_DUMP_FILENAME);
        IOFileFilter excludeHashesFile = new NotFileFilter(hashDumpFileFilter);
        return FileUtils.listFiles(new File(localMusicFileLocation), excludeHashesFile, TrueFileFilter.INSTANCE);
    }

    /**
     * Load the hash dump and build the cache.
     */
    public void buildCacheFromHashDump() throws IOException {
        log.debug("Begin building hash dump cache");
        Map<String, String> files = hashService.loadExistingHashDump();
        for (Map.Entry<String, String> file : files.entrySet()) {
            hashDumpCache.put(Long.valueOf(FilenameUtils.removeExtension(file.getKey())), file.getKey());
        }
        log.debug("Finish building hash dump cache");
    }

    /**
     * Clear the hash dump cache.
     */
    public void clearCacheFromHashDump() {
        hashDumpCache.clear();
        log.debug("Cleared hash dump cache");
    }
}
