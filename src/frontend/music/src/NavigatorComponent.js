import React, {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import {Menu} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import {MUSIC_FILE_SOURCE_TYPES, ZUUL_ROUTE} from "./App";
import {getZuulRoute, handleRestResponse} from "./Utils";
import DropdownListComponent from "./navigation/common/DropdownListComponent";
import PropTypes from 'prop-types';

export const SONGS = 'Songs';

class NavigatorComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            activeItem: 'Songs',
            purgableTracksCount: "?",
            updatessCount: "?"
        }
    }

    componentDidMount() {
        this.countPurgableTracks();
        this.countUpdates();
    }

    performSync = (forceUpdates = false) => {
        this.setState({
            syncing: true,
            synced: false
        });
        let syncingMessage = toast.info("Syncing", {
            autoClose: false,
            hideProgressBar: true
        });
        fetch(this.props.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local ?
            "./sync?forceUpdates=" + forceUpdates :
            getZuulRoute("/admin/dbSync?forceUpdates=" + forceUpdates), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.props.songs)
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
                    this.props.listSongs();
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

    countPurgableTracks = () => {
        this.setState({
            loadingPurgableTracksCount: true,
            loadedPurgableTracksCount: false
        });
        fetch("." + ZUUL_ROUTE + "/admin/purge/count/")
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingPurgableTracksCount: false,
                        loadedPurgableTracksCount: true,
                        purgableTracksCount: result
                    });
                },
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to load purgable song count:<br/>{errorMessage}</div>));
                    this.setState({
                        loadingPurgableTracksCount: false,
                        loadedPurgableTracksCount: true,
                        errorPurgableTracksCount: error
                    });
                }
            );
    };

    countUpdates = () => {
        this.setState({
            loadingUpdatesCount: true,
            loadedUpdatesCount: false
        });
        fetch("." + ZUUL_ROUTE + "/admin/update/count/")
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        loadingUpdatesCount: false,
                        loadedUpdatesCount: true,
                        updatesCount: result
                    });
                },
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to load song update count:<br/>{errorMessage}</div>));
                    this.setState({
                        loadingUpdatesCount: false,
                        loadedUpdatesCount: true,
                        errorUpdatesCount: error
                    });
                }
            );
    };

    purgeTracks = () => {
        let purgingMessage = toast.info("Purging deleted tracks", {
            autoClose: false,
            hideProgressBar: true
        });
        fetch("." + ZUUL_ROUTE + "/admin/purge", {
            method: 'DELETE'
        })
            .then(handleRestResponse)
            .then(
                (result) => {
                    toast.dismiss(purgingMessage);
                    toast.success("Successfully purged deleted tracks.");
                    this.props.listSongs();
                },
                (error) => {
                    toast.dismiss(purgingMessage);
                    error.text().then(errorMessage => toast.error(<div>Failed to perform purge:<br/>{errorMessage}</div>));
                }
            );
    };

    applyUpdates = () => {
        let purgingMessage = toast.info("Applying updates to disk", {
            autoClose: false,
            hideProgressBar: true
        });
        fetch("." + ZUUL_ROUTE + "/admin/update", {
            method: 'POST'
        })
            .then(
                () => {
                    toast.dismiss(purgingMessage);
                    toast.success("Successfully applied updates to disk.");
                    this.props.listSongs();
                },
                (error) => {
                    toast.dismiss(purgingMessage);
                    error.text().then(errorMessage => toast.error(<div>Failed to apply updates:<br/>{errorMessage}</div>));
                }
            );
    };

    _isActive = (item) => this.state.activeItem === item;

    _setActiveMenuItem = (item) => this.setState({activeItem: item});

    render() {
        return (<Menu vertical>
                <Menu.Item
                    name={SONGS}
                    active={this._isActive(SONGS)}
                    onClick={() => {
                        this._setActiveMenuItem(SONGS);
                        return this.props.setActiveSongList(this.props.songs);
                    }}
                >
                    Music
                </Menu.Item>
                <DropdownListComponent
                    title={"Historical plays"}
                    valuesUrl={"/track/historical/"}
                    activeMenuItem={this.state.activeItem}
                    setActiveMenuItem={this._setActiveMenuItem}
                    setActiveSongList={this.props.setActiveSongList}/>
                <Menu.Item>
                    <DropdownListComponent
                        title={"Smart playlists"}
                        valuesUrl={"/playlist/smart"}
                        tracksUrl={"/track?smartPlaylist="}
                        valueGetter={(value) => value.id}
                        textGetter={(value) => value.name}
                        activeMenuItem={this.state.activeItem}
                        setActiveMenuItem={this._setActiveMenuItem}
                        setActiveSongList={this.props.setActiveSongList}/>
                    <Menu.Menu>
                        <Menu.Item
                            name={"Create smart playlist"}
                            onClick={this.props.showCreateSmartPlaylist}
                        >
                            Create smart playlist
                        </Menu.Item>
                        <DropdownListComponent
                            activeMenuItem={this.state.activeItem}
                            title={"Edit smart playlist"}
                            setActiveSongList={this.props.setActiveSongList}
                            valuesUrl={"/playlist/smart"}
                            setActiveMenuItem={this._setActiveMenuItem}
                            dropdownOnClickCallback={this.props.showEditSmartPlaylist}
                            valueGetter={(value) => value.id}
                            textGetter={(value) => value.name}
                        />
                    </Menu.Menu>
                </Menu.Item>
                {this.props.shouldShowSyncButtons() &&
                    <Menu.Item>
                        Administrative
                        <Menu.Menu>
                            <Menu.Item
                                name={"Sync"}
                                onClick={() => this.performSync()}
                            >
                                Sync
                            </Menu.Item>
                            <Menu.Item
                                name={"Sync, forcing updates"}
                                onClick={() => this.performSync(true)}
                            >
                                Sync, forcing updates
                            </Menu.Item>
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
                        </Menu.Menu>
                    </Menu.Item>
                }
            </Menu>
        )
    }
}

NavigatorComponent.propTypes = {
    showEditSmartPlaylist: PropTypes.func.isRequired,
    showCreateSmartPlaylist: PropTypes.func.isRequired,
    songs: PropTypes.array.isRequired,
    setActiveSongList: PropTypes.func.isRequired,
    shouldShowSyncButtons: PropTypes.bool.isRequired,
    musicFileSource: PropTypes.string,
    listSongs: PropTypes.func.isRequired
};

export default NavigatorComponent;
