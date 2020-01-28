package musicclient.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import music.settings.PrivateSettings;
import org.apache.commons.codec.digest.DigestUtils;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
public class HashService {
    Logger logger = LoggerFactory.getLogger(HashService.class);

    private final PrivateSettings privateSettings;
    ObjectMapper objectMapper = new ObjectMapper();
    public HashService(PrivateSettings privateSettings) {
        this.privateSettings = privateSettings;
    }

    /**
     * Load the hash dump file generated after a local sync.
     * @return map of filename to hash
     * @throws IOException
     */
    public Map<String, String> loadExistingHashDump() throws IOException {
        logger.info("Loading hash dump");
        try{
            String hashDump = FileUtils.readFileToString(getHashDumpFile(), StandardCharsets.UTF_8);
            return (Map<String, String>) objectMapper.readValue(hashDump, Map.class);
        } catch (FileNotFoundException e){
            logger.error("No existing hash dump found", e);
            return new HashMap<>();
        }
    }

    public void dumpHashesToDisk(Map<String, String> newFilesHashes) throws IOException {
        FileUtils.write(getHashDumpFile(), objectMapper.writeValueAsString(newFilesHashes), StandardCharsets.UTF_8);
    }

    private File getHashDumpFile(){
        return new File(privateSettings.getLocalMusicFileLocation() + privateSettings.getHASH_DUMP_FILENAME());
    }

    public String calculateHash(File file) throws IOException {
        return DigestUtils.sha512Hex(FileUtils.openInputStream(file));
    }

}
