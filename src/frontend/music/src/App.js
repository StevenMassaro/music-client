import React, {Component} from 'react';
import './App.css';
import SplitPane from "react-split-pane";
import SongListComponent from "./SongListComponent";
import UpNextComponent from "./UpNextComponent";
import PlayerComponent from "./PlayerComponent";

export const ZUUL_ROUTE = '/music-api';

export const MUSIC_FILE_SOURCE_TYPES = {
    local: 'local',
    remote: 'remote'
};


class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            loadingSongs: false,
            loadedSongs: false
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
        if (this.state.upNext && this.state.upNext[0]) {
            if (this.state.settings) {
                if (this.state.settings.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local) {
                    return "./track/" + this.state.upNext[0].id + "/stream";
                } else {
                    return "." + ZUUL_ROUTE + "/track/" + this.state.upNext[0].id + "/stream";
                }
            }
        } else {
            return undefined;
        }
    };

    onCurrentSongEnd = (audioElement) => {
        let upNext = Object.assign([], this.state.upNext);
        upNext.shift(); // remove current song
        this.setState({
            upNext: upNext
        }, () => audioElement.play()); // callback to start playing the next song
    };

    listSongs = () => {
        this.setState({
            loadingSongs: true,
            loadedSongs: false
        });
        fetch("." + ZUUL_ROUTE + "/track/")
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        loadingSongs: false,
                        loadedSongs: true,
                        songs: result
                    });
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    this.setState({
                        loadingSongs: false,
                        loadedSongs: true,
                        errorSongs: error
                    });
                }
            );
    };

    getSettings = () => {
        this.setState({
            loadingSettings: true,
            loadedSettings: false
        });
        fetch("./settings/")
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        loadingSettings: false,
                        loadedSettings: true,
                        settings: result
                    });
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    this.setState({
                        loadingSettings: false,
                        loadedSettings: true,
                        errorSettings: error
                    });
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
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({
                        syncing: false,
                        synced: true
                    });
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    this.setState({
                        syncing: false,
                        synced: true,
                        errorSync: error
                    });
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

    modifyUpNext = (newUpNext) => {
        this.setState({
            upNext: newUpNext
        });
    };

    render() {
        return (
            <div>
                <SplitPane split="horizontal" defaultSize="8%">
                    <PlayerComponent
                        currentSongSrc={this.getCurrentSongSrc}
                        onSongEnd={this.onCurrentSongEnd}
                        shuffle={this.shuffle}
                        songs={this.state.songs}
                        performSync={this.performSync}
                        settings={this.state.settings}
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
