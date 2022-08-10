import React, {Component} from 'react';
import './App.css';
import SplitPane from "react-split-pane";
import UpNextComponent from "./UpNextComponent";
import PlayerComponent from "./PlayerComponent";
import {toast, ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.min.css';
import ReactJson from 'react-json-view'
import * as lodash from "lodash";
import {
    defaultFilterMethod,
    generateUrl
} from "./Utils";
import NavigatorComponent from "./NavigatorComponent";
import EditMetadataComponent from "./EditMetadataComponent";
import CreatePlaylistComponent, { PlaylistTypeEnum } from "./playlist/CreatePlaylistComponent";
import EditAlbumArtComponent from "./EditAlbumArtComponent";
import UploadSongsComponent from "./UploadSongsComponent";
import MediaSession from '@mebtte/react-media-session';
import {PurgableSongsComponent} from "./PurgableSongsComponent";
import {Button, Modal} from "semantic-ui-react";
import {GenericSongListComponent} from "./navigation/common";
import {AxiosResponse} from "axios";
import {Settings} from "./types/Settings";
import {WebsocketListener} from "./WebsocketListener";
import download from 'downloadjs';
import {
    AdminEndpointApi,
    Device,
    DeviceEndpointApi,
    Library,
    LibraryEndpointApi,
    PlaylistEndpointApi,
    PlaylistRes, Track, TrackEndpointApi
} from "./server-api";

export const LISTENED_THRESHOLD = 0.75; //percentage of song needed to be listened to be considered a "play"

export const MUSIC_FILE_SOURCE_TYPES = {
    local: 'local',
    remote: 'remote'
};

export const api = require('axios').default.create();
export var AdminApi: AdminEndpointApi;
export var LibraryApi: LibraryEndpointApi;
export var PlaylistApi: PlaylistEndpointApi;
export var DeviceApi: DeviceEndpointApi;
export var TrackApi: TrackEndpointApi;

type props = {}

type state = {
    upNext: Track[],
    currentMusicIndex: number,
    loadedSettings: boolean,
    currentSongMarkedListened: boolean,
    modalContent: any,
    modalOnCloseCallback: (() => void) | undefined,
    activeSongList: Track[],
    activeSongListName: string | undefined,
    audioEl: HTMLAudioElement | undefined,
    settings: Settings | undefined,
    device: Device | undefined,
    playlists: PlaylistRes[],
    listingSongs: boolean,
    activeLibrary: Library | undefined
}

class App extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
            upNext: [],
            currentMusicIndex: 0,
            loadedSettings: false,
            currentSongMarkedListened: false,
            modalContent: undefined,
            modalOnCloseCallback: undefined,
            activeSongList: [],
            activeSongListName: undefined,
            audioEl: undefined,
            settings: undefined,
            device: undefined,
            playlists: [],
            listingSongs: false,
            activeLibrary: undefined
        };

        api.interceptors.response.use((response: AxiosResponse) => {
            console.log(response);
            return response;
        }, (error: any) => {
            console.log(error.toJSON());
            console.log(error.response);
            toast.error(`API call to ${error.config.url} failed: ${error.message}`, {
                autoClose: false
            });
            return Promise.reject(error);
        });
    }

    componentDidMount() {
        this.getSettings();
        document.body.style.backgroundPosition = "center";
        document.body.style.backgroundSize = "auto 100%";
        document.body.style.backgroundRepeat = "no-repeat";
    }

    addToEndOfUpNext = (song: Track) => {
        if (song) {
            let upNext = Object.assign([], this.state.upNext);
            upNext.push(song);
            this.setUpNext(upNext)
        }
    };

    /**
     * Set the upNext list in the state to the newUpNext, and automatically change the background album art as needed.
     */
    setUpNext = (newUpNext: Track[], resetCurrentMusicIndexToZero: Boolean = false) => {
        this.setState({
            upNext: newUpNext,
            currentMusicIndex: resetCurrentMusicIndexToZero ? 0 : this.state.currentMusicIndex
        }, () => {
            this._setBackgroundImage(this.state.upNext[this.state.currentMusicIndex].id);
        });
    };

    getCurrentSongSrc = () => {
        if (this._getCurrentSong()) {
            if (this.state.settings) {
                return generateUrl(this.state.settings, "/track/" + this._getCurrentSong()!.id + "/stream", this.buildServerUrl);
            }
        } else {
            return undefined;
        }
    };

    downloadSong = (track: Track) => {
        const url = generateUrl(this.state.settings, "/track/" + track.id + "/stream", this.buildServerUrl);

        api.get(url, {
            responseType: 'blob',
        }).then((response: AxiosResponse) => {
            download(response.data, track.title);
        });
    }

    /**
     * Get currently playing song object.
     * @private
     */
    _getCurrentSong = () => {
        if (this.state.upNext && this.state.upNext[this.state.currentMusicIndex]) {
            return this.state.upNext[this.state.currentMusicIndex];
        } else {
            return undefined;
        }
    };

    /**
     * Jump to playing another song in the up next queue. Perform end of song actions, like loading the next song in the queue.
     * @param skipped if true, mark the song as skipped in the database and record the number of seconds played before skipping
     * @param direction positive one to skip to next song, negative one to skip to previous song
     */
    navigateActiveSongInUpNext = (skipped = true, direction: number) => {
        if (skipped) {
            const durationBeforeSkipped = this.state.audioEl!.currentTime;
            console.log(`song played ${durationBeforeSkipped} seconds before being skipped`);
            const curThresh = this._determineCurrentListenedThreshold();
            if (curThresh < LISTENED_THRESHOLD) {
                console.log(`song is not considered listened to (listen threshold of ${curThresh}), marked as skipped`);
                this._markSkipped(this._getCurrentSong()!.id!, durationBeforeSkipped);
            }
            else {
                console.log(`song is considered listened to, not marking as skipped`);
                this.markListenedIfExceedsThreshold();
            }
        }
        this.setState({
            currentMusicIndex: this.state.currentMusicIndex + direction,
            currentSongMarkedListened: false
        }, () => {
            if (!lodash.isUndefined(this.state.upNext[this.state.currentMusicIndex])) {
                if (!lodash.isUndefined(this.state.audioEl)) {
                    this.state.audioEl!.play();
                }
                this._setBackgroundImage(this.state.upNext[this.state.currentMusicIndex].id);
            }
        });
    }


    _setBackgroundImage = (id: number) => {
        document.body.style.backgroundImage = "url(" + this._generateAlbumArtUrl(id) + ")";
    };

    _generateAlbumArtUrl = (id: number) => generateUrl(this.state.settings, "/track/" + id + "/art", this.buildServerUrl);

    listSongs = () => {
        this.setState({
            listingSongs: true
        });
        TrackApi.listUsingGET3(this.state.activeLibrary!.id)
            .then((result: Track[]) => {
                this.setActiveSongList(result);
                this.setState({
                    listingSongs: false
                });
            });
    };

    deleteSong = (id: number) => {
        TrackApi.deleteUsingDELETE1(id)
            .then((result: Track) => {
                let songs = this.state.activeSongList.filter((song: Track) => {
                    return song.id !== result.id
                });
                this.setActiveSongList(songs);
                toast.success("Marked '" + result.title + "' as deleted.");
            })
    };

    getSettings = () => {
        api.get("./settings/")
            .then(
                (result: AxiosResponse<Settings>) => {
                    let {data} = result;
                    api.defaults.headers.common['Authorization'] = `${data.serverApiAuthHeader}`;
                    api.defaults.headers.post['Content-Type'] = 'application/json';
                    api.defaults.headers.patch['Content-Type'] = 'application/json';
                    let config = {
                        // todo this needs to not do a replace, this is wrong
                        basePath: data.serverApiUrl.replaceAll("/Music", "")
                    }
                    AdminApi = new AdminEndpointApi(config)
                    LibraryApi = new LibraryEndpointApi(config)
                    PlaylistApi = new PlaylistEndpointApi(config)
                    DeviceApi = new DeviceEndpointApi(config)
                    TrackApi = new TrackEndpointApi(config)

                    this.setState({
                        loadedSettings: true,
                        settings: data
                    }, () => {
                        this._listPlaylists();
                        this.getDeviceId();
                    });
                });
    };

    _listPlaylists = () => {
        PlaylistApi.listUsingGET1().then(playlists => {
            this.setState({
                playlists
            });
        })
    }

    _addToPlaylist = (playlist: PlaylistRes, track: Track) => {
        PlaylistApi.addTrackToPlaylistUsingPATCH(playlist.id, track.id)
            .then(() => toast.success(`Added track ${track.title} - ${track.artist} to playlist ${playlist.name}`))
    }

    getDeviceId = () => {
        DeviceApi.getDeviceByNameUsingGET(this.state.settings!.deviceName).then(device => {
            this.setState({
                device
            });
        })
    };

    /**
     * Shuffle the provided songs
     * @param selector a function callback that is called on every song provided in songs before setting the state
     */
    shuffleSongs = (songs: Track[], selector = (s: Track) => s) => {
        let a = Object.assign([], songs);
        let j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        this.setUpNext(a.map(selector), true);
    };

    setAudioElement = (element: HTMLAudioElement | null) => {
        if (element && (!this.state.audioEl || this.state.audioEl !== element)) {
            this.setState({
                audioEl: element
            });
        }
    };

    clearUpNext = () => {
        // if clearing the up next list
        this.setState({
            currentSongMarkedListened: false
        });
        this.setUpNext([]);
    };

    removeFromUpNext = (index: number) => {
        let upNext = Object.assign([], this.state.upNext);
        upNext.splice(index, 1);
        this.setUpNext(upNext);
    };

    /**
     * Move a song in the up next list by the amount specified in the offset.
     * @param indexA index of song to move
     * @param offset the distance to move the song, -1 moves it one spot down, 1 moves it one spot up
     */
    moveInUpNext = (indexA: number, offset: number) => {
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
    playNext = (song: Track) => {
        let upNext = Object.assign([], this.state.upNext);
        upNext.splice(this.state.currentMusicIndex + 1, 0, song);
        this.setUpNext(upNext);
    };

    /**
     * Determine if the current playing song has exceeded the threshold that determines whether a song is considered
     * listened to. If exceeded threshold, then tell backend that song was listened to.
     */
    markListenedIfExceedsThreshold = () => {
        const curThresh = this._determineCurrentListenedThreshold();
        if (!this.state.currentSongMarkedListened && curThresh > LISTENED_THRESHOLD) {
            this._markListened(this._getCurrentSong()!.id!);
            this.setState({
                currentSongMarkedListened: true
            })
        }
    };

    /**
     * Determine what percent of the song has been listened to already. Returns a value between 0 and 1.
     */
    _determineCurrentListenedThreshold = () => this.state.audioEl!.currentTime / this.state.audioEl!.duration;

    /**
     * Send rest request to backend to record that song was played.
     * @private
     */
    _markListened = (id: number) => {
        TrackApi.markTrackAsListenedUsingPOST1(this.state.device!.id, id).then(track => {
            this._replaceSingleSongInSongsLists(id, track)
        })
    };

    /**
     * Safely replace a particular song in the state, then modify the state.
     * @param id song ID to look for
     * @param newSong the new song to replace the existing one
     * @private
     */
    _replaceSingleSongInSongsLists = (id: number, newSong: Track) => {
        // update the song in the active song list first
        let songIndex = this.state.activeSongList.findIndex((song: Track) => song.id === id);
        const updatedHeaders = this.state.activeSongList.map((obj: Track, index: number) => {
            return index === songIndex ? newSong : obj;
        });
        this.setActiveSongList(updatedHeaders);

        if (!lodash.isEmpty(this.state.upNext)) {
            let upNextIndex = this.state.upNext.findIndex(song => song.id === id);
            // if we can find the song in the up next list, update it there too
            if (upNextIndex > -1) {
                const updatedUpNext = this.state.upNext.map((obj, index) => {
                    return index === upNextIndex ? newSong : obj;
                })
                this.setUpNext(updatedUpNext);
            }
        }
    };

    /**
     * Send rest request to backend to record that song was skipped.
     * @param id track id
     * @param secondsPlayedBeforeSkip nullable parameter indicating the number of seconds that the song was played before it was skipped
     * @private
     */
    _markSkipped = (id: number, secondsPlayedBeforeSkip: number) => {
        TrackApi.markTrackAsSkippedUsingPOST(this.state.device!.id, id, secondsPlayedBeforeSkip)
            .then((result: Track) => this._replaceSingleSongInSongsLists(id, result));
    };

    showInfo = (song: Track) => {
        let copy = Object.assign([], song);
        // delete copy.target;
        this.setState({
            modalContent: <ReactJson src={copy}
                                     displayDataTypes={false}
            />
        });
    };

    showEditMetadata = (song: Track) => {
        this.setState({
            modalContent: <EditMetadataComponent song={song}
                                                 listSongs={this.listSongs}
                                                 buildServerUrl={this.buildServerUrl}
            />,
            modalOnCloseCallback: this.listSongs
        })
    };

    showEditAlbumArt = (song: Track) => {
        this.setState({
            modalContent: <EditAlbumArtComponent song={song}
                                                 buildServerUrl={this.buildServerUrl}
            />
        });
    };

    showCreatePlaylist = (type: PlaylistTypeEnum) => {
        this.setState({
            modalContent: <CreatePlaylistComponent
                playlistType={type}
                existingPlaylist={undefined}
                buildServerUrl={this.buildServerUrl}
            />,
            modalOnCloseCallback: this._listPlaylists
        });
    };

    showEditPlaylist = (type: PlaylistTypeEnum, toEdit: any) => {
        this.setState({
            modalContent: <CreatePlaylistComponent
                playlistType={type}
                existingPlaylist={toEdit}
                buildServerUrl={this.buildServerUrl}
            />,
            modalOnCloseCallback: this._listPlaylists
        });
    };

    /**
     * Show the modal to upload songs.
     * @param existingId if not null or undefined, this should be the ID of the song that is being replaced. If null or
     * undefined, it is assumed that new tracks are being uploaded and no tracks are being replaced.
     */
    showUploadSongs = (existingId: number | undefined = undefined) => {
        this.setState({
            modalContent: <UploadSongsComponent
                activeSongList={this.state.activeSongList}
                setActiveSongList={this.setActiveSongList}
                existingId={existingId}
                buildServerUrl={this.buildServerUrl}
            />,
            modalOnCloseCallback: this.listSongs
        });
    };

    showPurgableTracks = () =>
        this.setState({
            modalContent: <PurgableSongsComponent
                buildServerUrl={this.buildServerUrl}
            />,
            modalOnCloseCallback: this.listSongs
        });

    setActiveSongList = (songs: Track[], name: string | undefined = undefined) => {
        this.setState({
            activeSongList: songs,
            activeSongListName: name
        });
    };

    /**
     * Set the rating of a song.
     * @param id
     * @param rating
     * @private
     */
    _setRating = (id: number, rating: number) => {
        TrackApi.updateRatingUsingPATCH(id, rating)
            .then((result: Track) => this._replaceSingleSongInSongsLists(id, result))
    };

    /**
     * Given a relative path, build the full path to this resource using the server's API URL as defined in the client
     * servers settings.
     */
    buildServerUrl = (relativePath: string) => {
        return this.state.settings!.serverApiUrl
            .replaceAll("$HOST", window.location.origin)
            + (relativePath.startsWith("/") ? relativePath : "/" + relativePath);
    };

    render() {
        const currentSong = this._getCurrentSong();
        const albumArtUrl = currentSong && this._generateAlbumArtUrl(currentSong.id);

        return (
            this.state.loadedSettings ?
            <div>
                <ToastContainer/>
                <WebsocketListener
                    buildServerUrl={this.buildServerUrl}/>
                {(this.state.audioEl && currentSong) &&
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
                    onPlay={() => this.state.audioEl!.play()}
                    onNextTrack={() => this.navigateActiveSongInUpNext(true, 1)}
                    onPreviousTrack={() => this.navigateActiveSongInUpNext(true, -1)}
                />
                }
                <Modal open={this.state.modalContent !== undefined}
                       contentLabel="Song info">
                    <Modal.Content>
                        {this.state.modalContent}
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={() => this.setState({modalContent: undefined}, this.state.modalOnCloseCallback)}>
                            Close
                        </Button>
                    </Modal.Actions>
                </Modal>
                <SplitPane split="horizontal" defaultSize={112} style={{background: "rgba(255,255,255,0.85)"}}>
                    <PlayerComponent
                        currentSong={this._getCurrentSong}
                        settings={this.state.settings!}
                        currentSongSrc={this.getCurrentSongSrc}
                        markListenedIfExceedsThreshold={this.markListenedIfExceedsThreshold}
                        setAudioElement={this.setAudioElement}
                        buildServerUrl={this.buildServerUrl}
                        setRating={this._setRating}
                        navigateActiveSongInUpNext={this.navigateActiveSongInUpNext}
                    />
                    <div>
                        <SplitPane split="vertical" defaultSize="15%">
                            <NavigatorComponent
                                setActiveSongList={this.setActiveSongList}
                                shouldShowSyncButtons={lodash.isEmpty(this.state.upNext)}
                                musicFileSource={this.state.settings!.musicFileSource}
                                listSongs={this.listSongs}
                                showCreatePlaylist={this.showCreatePlaylist}
                                showEditPlaylist={this.showEditPlaylist}
                                showUploadSongs={this.showUploadSongs}
                                buildServerUrl={this.buildServerUrl}
                                activeSongList={this.state.activeSongList}
                                showPurgableTracksModalCallback={this.showPurgableTracks}
                                activeLibrary={this.state.activeLibrary}
                                setActiveLibrary={(activeLibrary: Library, callback?: () => void) => this.setState({activeLibrary}, callback)}
                            />
                            <SplitPane split="vertical" defaultSize="70%">
                                <div className="songListPane">
                                    <GenericSongListComponent
                                        addToEndOfUpNext={this.addToEndOfUpNext}
                                        defaultFilterMethod={defaultFilterMethod}
                                        activeSongList={this.state.activeSongList}
                                        activeSongListName={this.state.activeSongListName}
                                        deleteSong={this.deleteSong}
                                        playNext={this.playNext}
                                        shuffleSongs={this.shuffleSongs}
                                        showInfo={this.showInfo}
                                        showEditMetadata={this.showEditMetadata}
                                        showEditAlbumArt={this.showEditAlbumArt}
                                        showUploadSongs={this.showUploadSongs}
                                        buildServerUrl={this.buildServerUrl}
                                        setRating={this._setRating}
                                        playlists={this.state.playlists}
                                        addToPlaylist={this._addToPlaylist}
                                        listingSongs={this.state.listingSongs}
                                        downloadSong={this.downloadSong}
                                    />
                                </div>
                                <div>
                                    <UpNextComponent
                                        upNext={this.state.upNext}
                                        currentMusicIndex={this.state.currentMusicIndex}
                                        clearUpNext={this.clearUpNext}
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
