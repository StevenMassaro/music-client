import * as React from 'react';
import {Component} from 'react';
import './App.css';
import {Menu} from 'semantic-ui-react'
import {toast} from "react-toastify";
import {AdminApi, api, LibraryApi, MUSIC_FILE_SOURCE_TYPES} from "./App";
import {DropdownListComponent} from "./navigation/common";
import {AxiosResponse} from "axios";
import {Library} from "./server-api";
import {MenuItem} from "./types/MenuItem";
import {SmartPlaylist} from "./types/SmartPlaylist";
import {Track} from "./types/Track";
import {Playlist} from "./types/Playlist";
import {PlaylistTypeEnum} from "./playlist/CreatePlaylistComponent";
import lodash from 'lodash';

type props = {
    showEditPlaylist: (type: PlaylistTypeEnum, toEdit: Object) => void,
    showCreatePlaylist: (type: PlaylistTypeEnum) => void,
    showUploadSongs: () => void,
    setActiveSongList: (songs: Track[], name: string | undefined) => void,
    activeSongList: object[],
    shouldShowSyncButtons: boolean,
    musicFileSource: string,
    listSongs: () => void,
    buildServerUrl: (relativePath: string) => string,
    showPurgableTracksModalCallback: () => void,
    setActiveLibrary: (library: Library, callback?: () => void) => void
    activeLibrary: Library | undefined
};
type state = {
    activeItem: MenuItem | null,
    purgableTracksCount?: number,
    updatesCount?: number,
    libraries: Library[]
};

class NavigatorComponent extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
            activeItem: null,
            purgableTracksCount: undefined,
            updatesCount: undefined,
            libraries: []
        }
    }

    componentDidMount() {
        this.countPurgableTracks();
        this.countUpdates();
        this.listLibraries();
        // todo the navigator component needs to set the active song list
    }

    listLibraries = () => {
        LibraryApi.listUsingGET().then(libraries => {
            const activeLibrary = libraries[0];
            this.setState({
                libraries: libraries,
                activeItem: new MenuItem(activeLibrary.name, activeLibrary) // todo after implementing library sorting on backend this should be smarter
            }, () => this.props.setActiveLibrary(activeLibrary, this.props.listSongs));
        })
    };

    performSync = (url: string) => {
        const toastId = toast.info("Starting sync.", {
            autoClose: false
        });
        api.post(url, this.props.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local ? this.props.activeSongList : null)
            .then(
                // This response is purposefully not deserialized because the music and music-client response objects are different shapes.
                (response: AxiosResponse) => {
                    toast.dismiss(toastId);
                    toast.success((<div>Finished sync successfully.<br/>{JSON.stringify(response.data, null, 2)}</div>), {
                        autoClose: false
                    });
                    this._refreshSongListWithActiveLibrary();
                });
    };

    _refreshSongListWithActiveLibrary = () => {
        if (this.state.activeItem!.library) {
            this.props.listSongs();
        }
    };

    countPurgableTracks = () => {
        AdminApi.countPurgableTracksUsingGET().then(result => {
            this.setState({
                purgableTracksCount: result
            });
        })
    };

    countUpdates = () => {
        AdminApi.countUpdatesUsingGET().then(result => {
            this.setState({
                updatesCount: result
            });
        })
    };

    applyUpdates = () => {
        let purgingMessage = toast.info("Applying updates to disk", {
            autoClose: false,
            hideProgressBar: true
        });
        AdminApi.applyUpdatesToSongsUsingPOST().then(() => {
            toast.dismiss(purgingMessage);
            toast.success("Successfully applied updates to disk.");
            this._refreshSongListWithActiveLibrary();
        })
    };

    _isActive = (name: string) => this.state.activeItem!.name === name;

    _setActiveMenuItem = (name: string, library?: Library, callback?: (() => void) | undefined) => {
        if (library) {
            this.props.setActiveLibrary(library, callback);
        }
        this.setState({activeItem: new MenuItem(name, library)});
    };

    render() {
        return (<Menu vertical fluid={true}
                        // style={{"max-height": "100%", "width": "100%", "overflow": "auto"}}
            >
                {this.state.libraries.map(library => {
                    return <Menu.Item
                        key={library.id}
                        name={library.name}
                        active={this._isActive(library.name)}
                        onClick={() => {
                            this.props.setActiveSongList([], undefined);
                            return this._setActiveMenuItem(library.name, library, () => this._refreshSongListWithActiveLibrary());
                        }}
                    >
                        {library.name}
                    </Menu.Item>
                })}
                <DropdownListComponent
                    title={"Historical plays"}
                    valuesUrl={"/track/historical/"}
                    activeMenuItem={this.state.activeItem!}
                    setActiveMenuItem={this._setActiveMenuItem}
                    setActiveSongList={this.props.setActiveSongList}
                    buildServerUrl={this.props.buildServerUrl}
                    shouldListTracksOnClick={true}
                />
                <Menu.Item>
                    <DropdownListComponent
                        title={"Smart playlists"}
                        valuesUrl={"/playlist/smart"}
                        tracksUrl={"/track?smartPlaylist="}
                        valueGetter={(value: SmartPlaylist) => value.id}
                        textGetter={(value: SmartPlaylist) => value.name}
                        activeMenuItem={this.state.activeItem!}
                        setActiveMenuItem={this._setActiveMenuItem}
                        setActiveSongList={this.props.setActiveSongList}
                        buildServerUrl={this.props.buildServerUrl}
                        shouldListTracksOnClick={true}
                    />
                    <Menu.Menu>
                        <Menu.Item
                            name={"Create smart playlist"}
                            onClick={() => this.props.showCreatePlaylist(PlaylistTypeEnum.smart)}
                        >
                            Create smart playlist
                        </Menu.Item>
                        <DropdownListComponent
                            activeMenuItem={this.state.activeItem!}
                            title={"Edit smart playlist"}
                            setActiveSongList={this.props.setActiveSongList}
                            valuesUrl={"/playlist/smart"}
                            setActiveMenuItem={this._setActiveMenuItem}
                            dropdownOnClickCallback={(value: SmartPlaylist) => this.props.showEditPlaylist(PlaylistTypeEnum.smart, value)}
                            valueGetter={(value: SmartPlaylist) => value.id}
                            textGetter={(value: SmartPlaylist) => value.name}
                            buildServerUrl={this.props.buildServerUrl}
                            shouldListTracksOnClick={true}
                        />
                    </Menu.Menu>
                </Menu.Item>
                <Menu.Item>
                    <DropdownListComponent
                        title={"Playlists"}
                        valuesUrl={"/playlist"}
                        tracksUrl={"/track?playlist="}
                        valueGetter={(value: Playlist) => value.id}
                        textGetter={(value: Playlist) => value.name}
                        activeMenuItem={this.state.activeItem!}
                        setActiveMenuItem={this._setActiveMenuItem}
                        setActiveSongList={this.props.setActiveSongList}
                        buildServerUrl={this.props.buildServerUrl}
                        shouldListTracksOnClick={true}
                    />
                    <Menu.Menu>
                        <Menu.Item
                            name={"Create playlist"}
                            onClick={() => this.props.showCreatePlaylist(PlaylistTypeEnum.default)}
                        >
                            Create playlist
                        </Menu.Item>
                        <DropdownListComponent
                            activeMenuItem={this.state.activeItem!}
                            title={"Edit playlist"}
                            setActiveSongList={this.props.setActiveSongList}
                            valuesUrl={"/playlist"}
                            setActiveMenuItem={this._setActiveMenuItem}
                            dropdownOnClickCallback={(value: Playlist) => this.props.showEditPlaylist(PlaylistTypeEnum.default, value)}
                            valueGetter={(value: Playlist) => value.id}
                            textGetter={(value: Playlist) => value.name}
                            buildServerUrl={this.props.buildServerUrl}
                            shouldListTracksOnClick={true}
                        />
                    </Menu.Menu>
                </Menu.Item>
                {this.props.shouldShowSyncButtons &&
                <Menu.Item>
                    Administrative
                    <Menu.Menu>
                        <Menu.Item
                            name={"Sync server active library"}
                            onClick={() => this.performSync(this.props.buildServerUrl(`/admin/dbSync?forceUpdates=false&libraryId=${this.state.activeItem!.library!.id}`))}
                        >
                            Sync server active library
                        </Menu.Item>
                        <Menu.Item
                            name={"Sync server active library, forcing updates"}
                            onClick={() => this.performSync(this.props.buildServerUrl(`/admin/dbSync?forceUpdates=true&libraryId=${this.state.activeItem!.library!.id}`))}
                        >
                            Sync server active library, forcing updates
                        </Menu.Item>
                        {this.props.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local &&
                        <Menu.Item
                            name={"Sync client active library"}
                                    onClick={() => this.performSync("./sync")}
                                >
                                    Sync client active library
                                </Menu.Item>
                            }
                            {
                                !lodash.isUndefined(this.state.purgableTracksCount) && <Menu.Item
                                    name={"Purge deleted tracks"}
                                    onClick={() => this.props.showPurgableTracksModalCallback()}
                                >
                                    Purge deleted tracks ({this.state.purgableTracksCount})
                                </Menu.Item>
                            }
                            {
                                !lodash.isUndefined(this.state.updatesCount) && <Menu.Item
                                    name={"Apply updates to disk"}
                                    onClick={() => this.applyUpdates()}
                                >
                                    Apply updates to disk ({this.state.updatesCount})
                                </Menu.Item>
                            }
                            <Menu.Item
                                name={"Upload songs"}
                                onClick={() => this.props.showUploadSongs()}
                            >
                                Upload songs
                            </Menu.Item>
                        </Menu.Menu>
                    </Menu.Item>
                }
            </Menu>
        )
    }
}

export default NavigatorComponent;
