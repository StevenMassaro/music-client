import React, {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import {Menu} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import {MUSIC_FILE_SOURCE_TYPES} from "./App";
import DropdownListComponent from "./navigation/common/DropdownListComponent";
import PropTypes from 'prop-types';

const axios = require('axios').default;

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
        axios.post(this.props.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local ?
            "./sync?forceUpdates=" + forceUpdates :
            this.props.buildServerUrl("/admin/dbSync?forceUpdates=" + forceUpdates), this.props.songs)
            .then(
                () => {
                    this.setState({
                        syncing: false,
                        synced: true
                    });
                    toast.success("Finished sync successfully.");
                    this.props.listSongs();
                })
            .catch(
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

    countPurgableTracks = () => {
        this.setState({
            loadingPurgableTracksCount: true,
            loadedPurgableTracksCount: false
        });
        axios.get(this.props.buildServerUrl("/admin/purge/count/"))
            .then(
                (result) => {
                    this.setState({
                        loadingPurgableTracksCount: false,
                        loadedPurgableTracksCount: true,
                        purgableTracksCount: result.data
                    });
                })
            .catch(
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
        axios.get(this.props.buildServerUrl("/admin/update/count/"))
            .then(
                (result) => {
                    this.setState({
                        loadingUpdatesCount: false,
                        loadedUpdatesCount: true,
                        updatesCount: result.data
                    });
                })
            .catch(
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
        axios.delete(this.props.buildServerUrl("/admin/purge"))
            .then(
                () => {
                    toast.dismiss(purgingMessage);
                    toast.success("Successfully purged deleted tracks.");
                    this.props.listSongs();
                })
            .catch(
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
        axios.post(this.props.buildServerUrl("/admin/update"))
            .then(
                () => {
                    toast.dismiss(purgingMessage);
                    toast.success("Successfully applied updates to disk.");
                    this.props.listSongs();
                })
            .catch(
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
                    setActiveSongList={this.props.setActiveSongList}
                    buildServerUrl={this.props.buildServerUrl}/>
                <Menu.Item>
                    <DropdownListComponent
                        title={"Smart playlists"}
                        valuesUrl={"/playlist/smart"}
                        tracksUrl={"/track?smartPlaylist="}
                        valueGetter={(value) => value.id}
                        textGetter={(value) => value.name}
                        activeMenuItem={this.state.activeItem}
                        setActiveMenuItem={this._setActiveMenuItem}
                        setActiveSongList={this.props.setActiveSongList}
                        buildServerUrl={this.props.buildServerUrl}/>
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
                            buildServerUrl={this.props.buildServerUrl}
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

NavigatorComponent.propTypes = {
    showEditSmartPlaylist: PropTypes.func.isRequired,
    showCreateSmartPlaylist: PropTypes.func.isRequired,
    showUploadSongs: PropTypes.func.isRequired,
    songs: PropTypes.array.isRequired,
    setActiveSongList: PropTypes.func.isRequired,
    shouldShowSyncButtons: PropTypes.bool.isRequired,
    musicFileSource: PropTypes.string,
    listSongs: PropTypes.func.isRequired
};

export default NavigatorComponent;
