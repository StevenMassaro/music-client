package musicclient.service;

import musicclient.model.impl.PrivateSettings;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.Collection;

@Service
public class TrackService {

    Logger logger = LoggerFactory.getLogger(TrackService.class);

    @Autowired
    private PrivateSettings privateSettings;

    /**
     * Returns the first file found that matches the supplied ID with any extension. Throws exceptions if more than one
     * file is found or no matching files are found.
     * @return the matching file if found
     * @throws IOException when no files are found or too many files are found
     */
    public File getFile(long id) throws IOException {
        Collection<File> possibleFiles = listFiles(id);
        if(possibleFiles.isEmpty()){
            throw new IOException(String.format("No files found on disk that match ID %s", id));
        } else if(possibleFiles.size() > 1){
            throw new IOException(String.format("Found %s files on disk that match ID %s and expected only 1", possibleFiles.size(), id));
        } else {
            for(File file : possibleFiles){
                return file;
            }
            return null;
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
        logger.debug(String.format("Begin listing filtered files (ID: %s)", id));
        IOFileFilter fileFilter = new WildcardFileFilter(id + ".*");
        Collection<File> files = FileUtils.listFiles(new File(privateSettings.getLocalMusicFileLocation()), fileFilter, null);
        logger.debug(String.format("Finish listing filtered files (ID: %s)", id));
        return files;
    }

    /**
     * List all files in the local music file location, except the hash dump file.
     */
    public Collection<File> listFiles(){
        IOFileFilter hashDumpFileFilter = new NameFileFilter(privateSettings.getHASH_DUMP_FILENAME());
        IOFileFilter excludeHashesFile = new NotFileFilter(hashDumpFileFilter);
        return FileUtils.listFiles(new File(privateSettings.getLocalMusicFileLocation()), excludeHashesFile, TrueFileFilter.INSTANCE);
    }
}
