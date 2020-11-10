import * as React from 'react';
import {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import {Menu} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import {api, MUSIC_FILE_SOURCE_TYPES} from "./App";
import {DropdownListComponent} from "./navigation/common";
import {AxiosResponse} from "axios";
import {Library} from "./types/Library";
import {MenuItem} from "./types/MenuItem";
import {SmartPlaylist} from "./types/SmartPlaylist";

type props = {
    showEditSmartPlaylist: (toEdit: Object) => void,
    showCreateSmartPlaylist: () => void,
    showUploadSongs: () => void,
    setActiveSongList: (songs?: Object) => void,
    activeSongList: object[],
    shouldShowSyncButtons: boolean,
    musicFileSource: string,
    listSongs: (libraryId: number) => void,
    buildServerUrl: (relativePath: string) => string
};
type state = {
    activeItem: MenuItem | null,
    purgableTracksCount: string,
    updatesCount: string,
    libraries: Library[]
};

class NavigatorComponent extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
            activeItem: null,
            purgableTracksCount: "?",
            updatesCount: "?",
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
        api.get<Library[]>(this.props.buildServerUrl('/library'))
            .then((response: AxiosResponse) => {
                this.setState({
                    libraries: response.data,
                    activeItem: new MenuItem(response.data[0].name, response.data[0]) // todo after implementing library sorting on backend this should be smarter
                }, () => this.props.listSongs(this.state.activeItem!.library!.id));
            });
    };

    performSync = (url: string) => {
        const toastId = toast.info("Starting sync.", {
            autoClose: false
        });
        api.post(url, this.props.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local ? this.props.activeSongList : null)
            .then(
                () => {
                    toast.dismiss(toastId);
                    toast.success(`Finished sync successfully.`, {
                        autoClose: false
                    });
                    this._refreshSongListWithActiveLibrary();
                });
    };

    _refreshSongListWithActiveLibrary = () => {
        if (this.state.activeItem!.library) {
            this.props.listSongs(this.state.activeItem!.library!.id);
        }
    };

    countPurgableTracks = () => {
        api.get(this.props.buildServerUrl("/admin/purge/count/"))
            .then(
                (result: { data: any; }) => {
                    this.setState({
                        purgableTracksCount: result.data
                    });
                });
    };

    countUpdates = () => {
        api.get(this.props.buildServerUrl("/admin/update/count/"))
            .then(
                (result: { data: any; }) => {
                    this.setState({
                        updatesCount: result.data
                    });
                });
    };

    purgeTracks = () => {
        let purgingMessage = toast.info("Purging deleted tracks", {
            autoClose: false,
            hideProgressBar: true
        });
        api.delete(this.props.buildServerUrl("/admin/purge"))
            .then(
                () => {
                    toast.dismiss(purgingMessage);
                    toast.success("Successfully purged deleted tracks.");
                    this._refreshSongListWithActiveLibrary();
                });
    };

    applyUpdates = () => {
        let purgingMessage = toast.info("Applying updates to disk", {
            autoClose: false,
            hideProgressBar: true
        });
        api.post(this.props.buildServerUrl("/admin/update"))
            .then(
                () => {
                    toast.dismiss(purgingMessage);
                    toast.success("Successfully applied updates to disk.");
                    this._refreshSongListWithActiveLibrary();
                });
    };

    _isActive = (name: string) => this.state.activeItem!.name === name;

    _setActiveMenuItem = (name: string, library?:Library, callback?: (() => void) | undefined) => this.setState({activeItem: new MenuItem(name, library)}, callback);

    render() {
        return (<Menu vertical>
                {this.state.libraries.map(library => {
                    return <Menu.Item
                        name={library.name}
                        active={this._isActive(library.name)}
                        onClick={() => {
                            this.props.setActiveSongList(undefined);
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
                    />
                    <Menu.Menu>
                        <Menu.Item
                            name={"Create smart playlist"}
                            onClick={this.props.showCreateSmartPlaylist}
                        >
                            Create smart playlist
                        </Menu.Item>
                        <DropdownListComponent
                            activeMenuItem={this.state.activeItem!}
                            title={"Edit smart playlist"}
                            setActiveSongList={this.props.setActiveSongList}
                            valuesUrl={"/playlist/smart"}
                            setActiveMenuItem={this._setActiveMenuItem}
                            dropdownOnClickCallback={this.props.showEditSmartPlaylist}
                            valueGetter={(value: SmartPlaylist) => value.id}
                            textGetter={(value: SmartPlaylist) => value.name}
                            buildServerUrl={this.props.buildServerUrl}
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
                            <Menu.Item
                                name={"Purge deleted tracks"}
                                onClick={() => this.purgeTracks()}
                            >
                                Purge deleted tracks ({this.state.purgableTracksCount})
                            </Menu.Item>
                            <Menu.Item
                                name={"Apply updates to disk"}
                                onClick={() => this.applyUpdates()}
                            >
                                Apply updates to disk ({this.state.updatesCount})
                            </Menu.Item>
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
