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
import {buildAlbumArtUpdateToastMessage, generateUrl, getZuulRoute, handleRestResponse} from "./Utils";
import NavigatorComponent from "./NavigatorComponent";
import EditMetadataComponent from "./EditMetadataComponent";
import CreateSmartPlaylistComponent from "./playlist/CreateSmartPlaylistComponent";
import EditAlbumArtComponent from "./EditAlbumArtComponent";
import SockJsClient from "react-stomp";

export const ZUUL_ROUTE = '/Music';
export const LISTENED_THRESHOLD = 0.75; //percentage of song needed to be listened to be considered a "play"
export const WEBSOCKET_ROUTES = {
    albumArtUpdates: '/topic/art/updates'
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
        this.listSongs();
        this.getSettings();
    }

    addToEndOfUpNext = (song) => {
        if (song) {
            let upNext = Object.assign([], this.state.upNext);
            if (lodash.isEmpty(upNext)) {
                this._setBackgroundImage(song.id);
            }
            upNext.push(song);
            this.setState({
                upNext: upNext
            });
        }
    };

    defaultFilterMethod = (filter, row, column) => {
        const id = filter.pivotId || filter.id;
        return row[id] !== undefined ? String(row[id]).toLowerCase().includes(filter.value.toLowerCase()) : true
    };

    getCurrentSongSrc = () => {
        if (this._getCurrentSong()) {
            if (this.state.settings) {
                return generateUrl(this.state.settings, "/track/" + this._getCurrentSong().id + "/stream");
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

    onCurrentSongEnd = () => {
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
        document.body.style.backgroundImage = "url(" + generateUrl(this.state.settings, "/track/" + id + "/art") + ")";
    };

    listSongs = () => {
        this.setState({
            loadingSongs: true,
            loadedSongs: false
        });
        fetch("." + ZUUL_ROUTE + "/track/")
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingSongs: false,
                        loadedSongs: true,
                        songs: result
                    }, () => this.setActiveSongList(this.state.songs));
                },
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
        fetch("." + ZUUL_ROUTE + "/track/" + id,{
            method: 'DELETE'
        })
            .then(handleRestResponse)
            .then((result) => {
                    let songs = this.state.songs.filter(song => {
                        return song.id !== result.id
                    });
                    this.modifySongs(songs);
                    this.setState({
                        deletingSong: false,
                        deletedSong: true
                    });
                    toast.success("Marked '" + result.title + "' as deleted.");
                },
                (error) => {
                    this.setState({
                        deletingSong: false,
                        deletedSong: true,
                        deletedSongError: error
                    });
                    error.text().then(errorMessage => toast.error(<div>Failed to delete song:<br/>{errorMessage}</div>));
                });
    };

    getSettings = () => {
        this.setState({
            loadingSettings: true,
            loadedSettings: false
        });
        fetch("./settings/")
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingSettings: false,
                        loadedSettings: true,
                        settings: result
                    }, this.getDeviceId);
                },
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
        fetch(getZuulRoute("/device/name/" + this.state.settings.deviceName))
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingDevice: false,
                        loadedDevice: true,
                        device: result
                    });
                },
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
        this.setState({
            upNext: a.map(selector)
        });
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
        this.setState({
            upNext: newUpNext
        });
    };

    removeFromUpNext = (index) => {
        let upNext = Object.assign([], this.state.upNext);
        upNext.splice(index, 1);
        this.setState({
            upNext
        });
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

        this.setState({
            upNext
        });
    };

    /**
     * Put the specified song next in line to be played
     * @param song
     */
    playNext = (song) => {
        let upNext = Object.assign([], this.state.upNext);
        upNext.splice(1, 0, song);
        this.setState({
            upNext
        });
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
        fetch(getZuulRoute("track/" + id + "/listened?deviceId=" + this.state.device.id), {
            method: 'POST'
        }).then(handleRestResponse)
            .then(
                () => {
                    let songs = Object.assign([], this.state.songs);
                    // find the matching song, and increment the play counter in the state
                    songs.find(song => song.id === id).plays++;
                    this.modifySongs(songs)
                },
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to mark song as listened:<br/>{errorMessage}</div>));
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
            />
        })
    };

    showEditAlbumArt = (song) => {
        this.setState({
            modalContent: <EditAlbumArtComponent song={song}/>
        });
    };

    showCreateSmartPlaylist = () => {
        this.setState({
            modalContent: <CreateSmartPlaylistComponent
                existingSmartPlaylist={null}
            />
        });
    };

    showEditSmartPlaylist = (toEdit) => {
        this.setState({
            modalContent: <CreateSmartPlaylistComponent
                existingSmartPlaylist={toEdit}
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
            this.handleAlbumArtUpdateToast(msg);
        }
    };

    handleAlbumArtUpdateToast = (msg) => {
        if (msg.position === 1) {
            toast.info(buildAlbumArtUpdateToastMessage(msg), {
                toastId: msg.album,
                autoClose: false,
                hideProgressBar: true
            });
        } else if (msg.position === msg.max) {
            toast.dismiss(msg.album);
        } else {
            toast.update(msg.album, {
                render: buildAlbumArtUpdateToastMessage(msg)
            });
        }
    };

    render() {
        return (
            <div>
                <SockJsClient
                    url={getZuulRoute("/gs-guide-websocket")}
                    topics={[WEBSOCKET_ROUTES.albumArtUpdates]}
                    onMessage={this.handleWebsocketMessage}
                />
                <ToastContainer/>
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
            </div>
        );
    }
}

export default App;
