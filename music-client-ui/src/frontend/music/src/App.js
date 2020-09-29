import React, {Component} from 'react';
import './App.css';
import SplitPane from "react-split-pane";
import SongListComponent from "./SongListComponent";
import UpNextComponent from "./UpNextComponent";
import PlayerComponent from "./PlayerComponent";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.min.css';
import Modal from 'react-modal';
import ReactJson from 'react-json-view'
import * as lodash from "lodash";
import {
    buildAlbumArtUpdateToastMessage,
    buildSyncUpdateToastMessage,
    generateUrl
} from "./Utils";
import NavigatorComponent from "./NavigatorComponent";
import EditMetadataComponent from "./EditMetadataComponent";
import CreateSmartPlaylistComponent from "./playlist/CreateSmartPlaylistComponent";
import EditAlbumArtComponent from "./EditAlbumArtComponent";
import SockJsClient from "react-stomp";
import UploadSongsComponent from "./UploadSongsComponent";
import MediaSession from '@mebtte/react-media-session';

const axios = require('axios').default;

export const LISTENED_THRESHOLD = 0.75; //percentage of song needed to be listened to be considered a "play"
export const WEBSOCKET_ROUTES = {
    albumArtUpdates: '/topic/art/updates',
    syncUpdates: '/topic/sync/updates'
};

export const MUSIC_FILE_SOURCE_TYPES = {
    local: 'local',
    remote: 'remote'
};

class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loadingSongs: false,
            loadedSongs: false,
            loadedSettings: false,
            currentSongMarkedListened: false,
            modalContent: undefined,
            activeSongList: undefined
        };
    }

    componentWillMount() {
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundSize = "auto 100%";
        document.body.style.backgroundRepeat = "no-repeat";
    }

    componentDidMount() {
        this.getSettings(this.listSongs);
    }

    addToEndOfUpNext = (song) => {
        if (song) {
            let upNext = Object.assign([], this.state.upNext);
            upNext.push(song);
            this.setUpNext(upNext)
        }
    };

    /**
     * Set the upNext list in the state to the newUpNext, and automatically change the background album art as needed.
     * @param newUpNext
     */
    setUpNext = (newUpNext) => {
        if(!lodash.isEmpty(newUpNext)){
            this._setBackgroundImage(newUpNext[0].id);
        }
        this.setState({
            upNext: newUpNext
        });
    };

    defaultFilterMethod = (filter, row, column) => {
        const id = filter.pivotId || filter.id;
        return row[id] !== undefined ? String(row[id]).toLowerCase().includes(filter.value.toLowerCase()) : true
    };

    getCurrentSongSrc = () => {
        if (this._getCurrentSong()) {
            if (this.state.settings) {
                return generateUrl(this.state.settings, "/track/" + this._getCurrentSong().id + "/stream", this.buildServerUrl);
            }
        } else {
            return undefined;
        }
    };

    /**
     * Get currently playing song object.
     * @private
     */
    _getCurrentSong = () => {
        if (this.state.upNext && this.state.upNext[0]) {
            return this.state.upNext[0];
        } else {
            return undefined;
        }
    };

    /**
     * Perform end of song actions, like loading the next song in the queue.
     * @param skipped if true, mark the song as skipped in the database and record the number of seconds played before skipping
     */
    onCurrentSongEnd = (skipped = false) => {
        if (skipped) {
            const durationBeforeSkipped = this.state.audioEl.currentTime;
            console.log(`song played ${durationBeforeSkipped} seconds before being skipped`);
            this._markSkipped(this._getCurrentSong().id, durationBeforeSkipped);
        }
        let upNext = Object.assign([], this.state.upNext);
        upNext.shift(); // remove current song
        if (!lodash.isEmpty(upNext)) {
            this._setBackgroundImage(upNext[0].id);
        }
        this.setState({
            upNext: upNext,
            currentSongMarkedListened: false
        }, () => this.state.audioEl.play());
    };

    _setBackgroundImage = (id) => {
        document.body.style.backgroundImage = "url(" + this._generateAlbumArtUrl(id) + ")";
    };

    _generateAlbumArtUrl = (id) => generateUrl(this.state.settings, "/track/" + id + "/art", this.buildServerUrl);

    listSongs = () => {
        this.setState({
            loadingSongs: true,
            loadedSongs: false
        });
        axios.get(this.buildServerUrl("/track/"))
            .then(
                (result) => {
                    this.setState({
                        loadingSongs: false,
                        loadedSongs: true,
                        songs: result.data
                    }, () => this.setActiveSongList(this.state.songs));
                })
            .catch(
                (error) => {
                    this.setState({
                        loadingSongs: false,
                        loadedSongs: true,
                        errorSongs: error
                    });
                    error.text().then(errorMessage => toast.error(<div>Failed to list songs:<br/>{errorMessage}</div>));
                }
            );
    };

    deleteSong = id => {
        this.setState({
            deletingSong: true,
            deletedSong: false
        });
        axios.delete(this.buildServerUrl("/track/" + id))
            .then((result) => {
                    let {data} = result;
                    let songs = this.state.songs.filter(song => {
                        return song.id !== data.id
                    });
                    this.modifySongs(songs);
                    this.setState({
                        deletingSong: false,
                        deletedSong: true
                    });
                    toast.success("Marked '" + data.title + "' as deleted.");
                })
            .catch(
                (error) => {
                    this.setState({
                        deletingSong: false,
                        deletedSong: true,
                        deletedSongError: error
                    });
                    error.text().then(errorMessage => toast.error(<div>Failed to delete song:<br/>{errorMessage}</div>));
                });
    };

    /**
     * @param settingsFetchedCallback This function is called after the settings are successfully loaded.
     */
    getSettings = (settingsFetchedCallback) => {
        this.setState({
            loadingSettings: true,
            loadedSettings: false
        });
        axios.get("./settings/")
            .then(
                (result) => {
                    let {data} = result;
                    axios.defaults.headers.common['Authorization'] = `${data.serverApiAuthHeader}`;
                    axios.defaults.headers.post['Content-Type'] = 'application/json';
                    axios.defaults.headers.patch['Content-Type'] = 'application/json';
                    this.setState({
                        loadingSettings: false,
                        loadedSettings: true,
                        settings: data
                    }, () => {
                        this.getDeviceId();
                        settingsFetchedCallback();
                    });
                })
            .catch(
                (error) => {
                    this.setState({
                        loadingSettings: false,
                        loadedSettings: true,
                        errorSettings: error
                    });
                    error.text().then(errorMessage => toast.error(<div>Failed to load settings:<br/>{errorMessage}</div>));
                }
            );
    };

    getDeviceId = () => {
        this.setState({
            loadingDevice: true,
            loadedDevice: false
        });
        axios.get(this.buildServerUrl("/device/name/" + this.state.settings.deviceName))
            .then(
                (result) => {
                    this.setState({
                        loadingDevice: false,
                        loadedDevice: true,
                        device: result.data
                    });
                })
            .catch(
                (error) => {
                    this.setState({
                        loadingDevice: false,
                        loadedDevice: true,
                        errorDevice: error
                    });
                    error.text().then(errorMessage => toast.error(<div>Failed to load device:<br/>{errorMessage}</div>));
                }
            );
    };

    /**
     * Shuffle the provided songs
     * @param selector a function callback that is called on every song provided in songs before setting the state
     */
    shuffleSongs = (songs, selector = s => s) => {
        let a = Object.assign([], songs);
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        this.setUpNext(a.map(selector));
    };

    setAudioElement = (element) => {
        if(element && (!this.state.audioEl || this.state.audioEl !== element.audioEl)){
            this.setState({
                audioEl: element.audioEl
            });
        }
    };

    modifyUpNext = (newUpNext) => {
        // if clearing the up next list
        if(newUpNext === []){
            this.setState({
                currentSongMarkedListened: false
            });
        }
        this.setUpNext(newUpNext);
    };

    removeFromUpNext = (index) => {
        let upNext = Object.assign([], this.state.upNext);
        upNext.splice(index, 1);
        this.setUpNext(upNext);
    };

    /**
     * Modify the state's songs and automatically set the active song list
     * @param newSongs
     */
    modifySongs = (newSongs) => {
        let shouldResetActiveSongList = lodash.isEqual(this.state.songs, this.state.activeSongList);
        this.setState({
            songs: newSongs
        }, () => shouldResetActiveSongList && this.setActiveSongList(this.state.songs));
    };

    /**
     * Move a song in the up next list by the amount specified in the offset.
     * @param indexA index of song to move
     * @param offset the distance to move the song, -1 moves it one spot down, 1 moves it one spot up
     */
    moveInUpNext = (indexA, offset) => {
        let upNext = Object.assign([], this.state.upNext);
        let indexB = indexA - offset;

        let tmp = upNext[indexA];
        upNext[indexA] = upNext[indexB];
        upNext[indexB] = tmp;

        this.setUpNext(upNext);
    };

    /**
     * Put the specified song next in line to be played
     * @param song
     */
    playNext = (song) => {
        let upNext = Object.assign([], this.state.upNext);
        upNext.splice(1, 0, song);
        this.setUpNext(upNext);
    };

    /**
     * Determine if the current playing song has exceeded the threshold that determines whether a song is considered
     * listened to. If exceeded threshold, then tell backend that song was listened to.
     */
    markListenedIfExceedsThreshold = () => {
        const curThresh = this.state.audioEl.currentTime / this.state.audioEl.duration;
        if (!this.state.currentSongMarkedListened && curThresh > LISTENED_THRESHOLD) {
            this._markListened(this._getCurrentSong().id);
            this.setState({
                currentSongMarkedListened: true
            })
        }
    };

    /**
     * Send rest request to backend to record that song was played.
     * @private
     */
    _markListened = (id) => {
        axios.post(this.buildServerUrl("track/" + id + "/listened?deviceId=" + this.state.device.id))
            .then(
                () => {
                    let songs = Object.assign([], this.state.songs);
                    // find the matching song, and increment the play counter in the state
                    songs.find(song => song.id === id).plays++;
                    this.modifySongs(songs)
                })
            .catch(
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to mark song as listened:<br/>{errorMessage}</div>));
                });
    };


    /**
     * Send rest request to backend to record that song was skipped.
     * @param id track id
     * @param secondsPlayedBeforeSkip nullable parameter indicating the number of seconds that the song was played before it was skipped
     * @private
     */
    _markSkipped = (id, secondsPlayedBeforeSkip) => {
        axios.post(this.buildServerUrl("track/" + id + "/skipped?deviceId=" + this.state.device.id + (secondsPlayedBeforeSkip ? "&secondsPlayed=" + secondsPlayedBeforeSkip : "")))
            .then(
                () => {
                    let songs = Object.assign([], this.state.songs);
                    // find the matching song, and increment the play counter in the state
                    songs.find(song => song.id === id).skips++;
                    this.modifySongs(songs)
                })
            .catch(
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to mark song as skipped:<br/>{errorMessage}</div>));
                });
    };

    showInfo = (song) => {
        let copy = Object.assign([], song);
        delete copy.target;
        this.setState({modalContent: <ReactJson src={copy}
                                                displayDataTypes={false}
            />});
    };

    showEditMetadata = (song) => {
        this.setState({
            modalContent: <EditMetadataComponent song={song}
                                                 listSongs={this.listSongs}
                                                 buildServerUrl={this.buildServerUrl}
            />
        })
    };

    showEditAlbumArt = (song) => {
        this.setState({
            modalContent: <EditAlbumArtComponent song={song}
                                                 buildServerUrl={this.buildServerUrl}
            />
        });
    };

    showCreateSmartPlaylist = () => {
        this.setState({
            modalContent: <CreateSmartPlaylistComponent
                existingSmartPlaylist={null}
                buildServerUrl={this.buildServerUrl}
            />
        });
    };

    showEditSmartPlaylist = (toEdit) => {
        this.setState({
            modalContent: <CreateSmartPlaylistComponent
                existingSmartPlaylist={toEdit}
                buildServerUrl={this.buildServerUrl}
            />
        });
    };

    /**
     * Show the modal to upload songs.
     * @param existingId if not null or undefined, this should be the ID of the song that is being replaced. If null or
     * undefined, it is assumed that new tracks are being uploaded and no tracks are being replaced.
     */
    showUploadSongs = (existingId = undefined) => {
        this.setState({
            modalContent: <UploadSongsComponent
                songs={this.state.songs}
                modifySongs={this.modifySongs}
                existingId={existingId}
                buildServerUrl={this.buildServerUrl}
            />
        });
    };

    setActiveSongList = (songs) => {
        this.setState({
            activeSongList: songs
        });
    };

    handleWebsocketMessage = (msg, topic) => {
        // todo there is probably a better way of doing this, but at the moment this works
        if (topic === WEBSOCKET_ROUTES.albumArtUpdates) {
            this.handleAlbumArtUpdateToast(msg,
                msg => buildAlbumArtUpdateToastMessage(msg),
                msg => msg.album);
        } else if (topic === WEBSOCKET_ROUTES.syncUpdates) {
            this.handleAlbumArtUpdateToast(msg,
                msg => buildSyncUpdateToastMessage(msg),
                () => "sync_updates_toast")
        }
    };

    handleAlbumArtUpdateToast = (msg, toastMessageCallback, toastIdCallback) => {
        if (msg.position === 0) {
            toast.info(toastMessageCallback(msg), {
                toastId: toastIdCallback(msg),
                autoClose: false,
                hideProgressBar: true
            });
        } else if (msg.position === msg.max) {
            toast.dismiss(toastIdCallback(msg));
        } else {
            toast.update(toastIdCallback(msg), {
                render: toastMessageCallback(msg)
            });
        }
    };

    /**
     * Given a relative path, build the full path to this resource using the server's API URL as defined in the client
     * servers settings.
     */
    buildServerUrl = (relativePath) => {
        return this.state.settings.serverApiUrl + (relativePath.startsWith("/") ? relativePath : "/" + relativePath);
    };

    render() {
        const currentSong = this._getCurrentSong();
        const albumArtUrl = currentSong && this._generateAlbumArtUrl(currentSong.id);

        return (
            this.state.loadedSettings ?
            <div>
                <SockJsClient
                    url={this.buildServerUrl("/gs-guide-websocket")}
                    topics={[WEBSOCKET_ROUTES.albumArtUpdates]}
                    onMessage={this.handleWebsocketMessage}
                />
                <SockJsClient
                    url={"./gs-guide-websocket"}
                    topics={[WEBSOCKET_ROUTES.syncUpdates]}
                    onMessage={this.handleWebsocketMessage}
                />
                <ToastContainer/>
                {this.state.audioEl &&
                <MediaSession
                    title={currentSong.title}
                    artist={currentSong.artist}
                    album={currentSong.album}
                    artwork={[
                        {
                            src: albumArtUrl,
                            sizes: '512x512'
                        }
                    ]}
                    onPlay={() => this.state.audioEl.play()}
                    onNextTrack={() => this.onCurrentSongEnd(false)}
                />
                }
                <Modal isOpen={this.state.modalContent !== undefined}
                       contentLabel="Song info">
                    <button onClick={() => this.setState({modalContent: undefined})}>Close</button>
                    {this.state.modalContent}
                </Modal>
                <SplitPane split="horizontal" defaultSize="8%" style={{background: "rgba(255,255,255,0.85)"}}>
                    <PlayerComponent
                        currentSong={this._getCurrentSong}
                        settings={this.state.settings}
                        currentSongSrc={this.getCurrentSongSrc}
                        onSongEnd={this.onCurrentSongEnd}
                        markListenedIfExceedsThreshold={this.markListenedIfExceedsThreshold}
                        setAudioElement={this.setAudioElement}
                        buildServerUrl={this.buildServerUrl}
                    />
                    <div>
                        <SplitPane split="vertical" defaultSize="15%">
                            <div>
                                <NavigatorComponent
                                    songs={this.state.songs}
                                    setActiveSongList={this.setActiveSongList}
                                    shouldShowSyncButtons={() => lodash.isEmpty(this.state.upNext)}
                                    musicFileSource={this.state.settings && this.state.settings.musicFileSource}
                                    listSongs={this.listSongs}
                                    showCreateSmartPlaylist={this.showCreateSmartPlaylist}
                                    showEditSmartPlaylist={this.showEditSmartPlaylist}
                                    showUploadSongs={this.showUploadSongs}
                                    buildServerUrl={this.buildServerUrl}
                                />
                            </div>
                            <SplitPane split="vertical" defaultSize="70%">
                                <div className="songListPane">
                                    <SongListComponent
                                        addToEndOfUpNext={this.addToEndOfUpNext}
                                        defaultFilterMethod={this.defaultFilterMethod}
                                        error={this.state.errorSongs}
                                        loadedSongs={this.state.loadedSongs}
                                        activeSongList={this.state.activeSongList}
                                        songs={this.state.songs}
                                        deleteSong={this.deleteSong}
                                        playNext={this.playNext}
                                        shuffleSongs={this.shuffleSongs}
                                        showInfo={this.showInfo}
                                        showEditMetadata={this.showEditMetadata}
                                        showEditAlbumArt={this.showEditAlbumArt}
                                        modifySongs={this.modifySongs}
                                        showUploadSongs={this.showUploadSongs}
                                        buildServerUrl={this.buildServerUrl}
                                    />
                                </div>
                                <div>
                                    <UpNextComponent
                                        upNext={this.state.upNext}
                                        modifyUpNext={this.modifyUpNext}
                                        defaultFilterMethod={this.defaultFilterMethod}
                                        removeFromUpNext={this.removeFromUpNext}
                                        moveInUpNext={this.moveInUpNext}
                                    />
                                </div>
                            </SplitPane>
                        </SplitPane>
                    </div>
                </SplitPane>
            </div> : <div>Loading settings...</div>
        );
    }
}

export default App;
