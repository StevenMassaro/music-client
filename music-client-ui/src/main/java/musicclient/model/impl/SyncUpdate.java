package musicclient.model.impl;

public class SyncUpdate {

    private final int position;
    private final int max;
    private final SyncStep syncStep;

    public SyncUpdate(int position, int max, SyncStep syncStep) {
        this.position = position;
        this.max = max;
        this.syncStep = syncStep;
    }

    public int getPosition() {
        return position;
    }

    public int getMax() {
        return max;
    }

    public SyncStep getSyncStep() {
        return syncStep;
    }
}
