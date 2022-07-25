package musicclient.model.impl;

import lombok.Data;

@Data
public class SyncUpdate {

    private final int position;
    private final int max;
    private final SyncStep syncStep;
}
