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
import {generateUrl, handleRestResponse} from "./Utils";
import NavigatorComponent from "./NavigatorComponent";

export const ZUUL_ROUTE = '/music-api';
export const LISTENED_THRESHOLD = 0.75; //percentage of song needed to be listened to be considered a "play"

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

    componentDidMount() {
        this.listSongs();
        this.listHistoricalDates();
        this.getSettings();
    }

    addToEndOfUpNext = (song) => {
        if (song) {
            let upNext = Object.assign([], this.state.upNext);
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
        this.setState({
            upNext: upNext,
            currentSongMarkedListened: false
        }, () => this.state.audioEl.play());
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

    listHistoricalDates = () => {
        this.setState({
            loadingHistoricalDates: true,
            loadedHistoricalDates: false
        });
        fetch("." + ZUUL_ROUTE + "/track/historical/dates")
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingHistoricalDates: false,
                        loadedHistoricalDates: true,
                        historicalDates: result
                    });
                },
                (error) => {
                    this.setState({
                        loadingHistoricalDates: false,
                        loadedHistoricalDates: true,
                        errorHistoricalDates: error
                    });
                    error.text().then(errorMessage => toast.error(<div>Failed to list historical
                        dates:<br/>{errorMessage}</div>));
                }
            );
    };

    /**
     * Get the relative path of a route which should be routed through Zuul.
     * @private
     */
    _getZuulRoute = (relativePath) => "." + ZUUL_ROUTE + (relativePath.startsWith("/") ? relativePath : "/" + relativePath);

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
                    this.setState({
                        deletingSong: false,
                        deletedSong: true,
                        songs: songs
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
        fetch(this._getZuulRoute("/device/name/" + this.state.settings.deviceName))
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

    performSync = (forceUpdates = false) => {
        this.setState({
            syncing: true,
            synced: false
        });
        let syncingMessage = toast.info("Syncing", {
            autoClose: false,
            hideProgressBar: true
        });
        fetch(this.state.settings.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local ?
          "./sync?forceUpdates=" + forceUpdates :
          this._getZuulRoute("/admin/dbSync?forceUpdates=" + forceUpdates), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.state.songs)
        })
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        syncing: false,
                        synced: true
                    });
                    toast.dismiss(syncingMessage);
                    toast.success("Finished sync successfully.");
                    this.listSongs();
                },
                (error) => {
                    this.setState({
                        syncing: false,
                        synced: true,
                        errorSync: error
                    });
                    toast.dismiss(syncingMessage);
                    error.text().then(errorMessage => toast.error(<div>Failed to perform sync:<br/>{errorMessage}</div>));
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
        fetch(this._getZuulRoute("track/" + id + "/listened?deviceId=" + this.state.device.id), {
            method: 'POST'
        }).then(handleRestResponse)
            .then(
                () => {
                    let songs = Object.assign([], this.state.songs);
                    // find the matching song, and increment the play counter in the state
                    songs.find(song => song.id === id).plays++;
                    this.setState({
                        songs
                    });
                },
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to mark song as listened:<br/>{errorMessage}</div>));
                });
    };

    showInfo = (song) => {
        let copy = Object.assign([], song);
        delete copy.target;
        this.setState({modalContent: copy});
    };

    setActiveSongList = (songs) => {
        this.setState({
            activeSongList: songs
        });
    };

    render() {
        return (
            <div>
                <ToastContainer/>
                <Modal isOpen={this.state.modalContent !== undefined}
                       contentLabel="Song info">
                    <button onClick={() => this.setState({modalContent: undefined})}>Close</button>
                    <ReactJson src={this.state.modalContent}
                               displayDataTypes={false}
                    />
                </Modal>
                <SplitPane split="horizontal" defaultSize="8%">
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
                                    historicalDates={this.state.historicalDates}
                                    songs={this.state.songs}
                                    setActiveSongList={this.setActiveSongList}
                                    performSync={this.performSync}
                                    shouldShowSyncButtons={() => lodash.isEmpty(this.state.upNext)}
                                />
                            </div>
                            <SplitPane split="vertical" defaultSize="70%">
                                <div className="songListPane">
                                    <SongListComponent
                                        addToEndOfUpNext={this.addToEndOfUpNext}
                                        defaultFilterMethod={this.defaultFilterMethod}
                                        error={this.state.errorSongs}
                                        loadedSongs={this.state.loadedSongs}
                                        songs={this.state.activeSongList}
                                        deleteSong={this.deleteSong}
                                        playNext={this.playNext}
                                        shuffleSongs={this.shuffleSongs}
                                        showInfo={this.showInfo}
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
