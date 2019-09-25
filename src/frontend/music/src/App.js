import React, {Component} from 'react';
import './App.css';
import SplitPane from "react-split-pane";
import SongListComponent from "./SongListComponent";
import UpNextComponent from "./UpNextComponent";
import PlayerComponent from "./PlayerComponent";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.min.css';

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
            currentSongMarkedListened: false
        };
    }

    componentDidMount() {
        this.listSongs();
        this.getSettings();
    }

    addToPlaylist = (song) => {
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
                if (this.state.settings.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local) {
                    return "./track/" + this._getCurrentSong().id + "/stream";
                } else {
                    return "." + ZUUL_ROUTE + "/track/" + this._getCurrentSong().id + "/stream";
                }
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
            .then(this._handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingSongs: false,
                        loadedSongs: true,
                        songs: result
                    });
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
            .then(this._handleRestResponse)
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
            .then(this._handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingSettings: false,
                        loadedSettings: true,
                        settings: result
                    });
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

    performSync = () => {
        this.setState({
            syncing: true,
            synced: false
        });
        fetch("./sync/", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.state.songs)
        })
            .then(this._handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        syncing: false,
                        synced: true
                    });
                    toast.success("Finished sync successfully.");
                },
                (error) => {
                    this.setState({
                        syncing: false,
                        synced: true,
                        errorSync: error
                    });
                    error.text().then(errorMessage => toast.error(<div>Failed to perform sync:<br/>{errorMessage}</div>));
                }
            );
    };

    shuffle = () => {
        let a = Object.assign([], this.state.songs);
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        this.setState({
            upNext: a
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
        fetch(this._getZuulRoute("track/" + id + "/listened"), {
            method: 'POST'
        }).then(this._handleRestResponse)
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

    /**
     * Properly parse the rest response. If the response does not come back OK, throw the exception.
     * @private
     */
    _handleRestResponse = (res) => {
        if (res.ok) {
            return res.json();
        } else {
            throw res;
        }
    };

    render() {
        return (
            <div>
                <ToastContainer/>
                <SplitPane split="horizontal" defaultSize="8%">
                    <PlayerComponent
                        currentSongSrc={this.getCurrentSongSrc}
                        onSongEnd={this.onCurrentSongEnd}
                        shuffle={this.shuffle}
                        songs={this.state.songs}
                        performSync={this.performSync}
                        settings={this.state.settings}
                        markListenedIfExceedsThreshold={this.markListenedIfExceedsThreshold}
                        setAudioElement={this.setAudioElement}
                    />
                    <div>
                        <SplitPane split="vertical" defaultSize="15%">
                            <div></div>
                            <SplitPane split="vertical" defaultSize="70%">
                                <div>
                                    <SongListComponent
                                        addToPlaylist={this.addToPlaylist}
                                        defaultFilterMethod={this.defaultFilterMethod}
                                        error={this.state.errorSongs}
                                        loadedSongs={this.state.loadedSongs}
                                        songs={this.state.songs}
                                        deleteSong={this.deleteSong}
                                    />
                                </div>
                                <div>
                                    <UpNextComponent
                                        upNext={this.state.upNext}
                                        modifyUpNext={this.modifyUpNext}
                                        defaultFilterMethod={this.defaultFilterMethod}
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
