import React, {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import {Dropdown, Menu} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import {MUSIC_FILE_SOURCE_TYPES, ZUUL_ROUTE} from "./App";
import {getZuulRoute, handleRestResponse} from "./Utils";

export const SONGS = 'Songs';

class NavigatorComponent extends Component {

    constructor(props) {
        super(props);
        this.state = {
            activeItem: 'Songs',
            purgableTracksCount: "?"
        }
    }

    componentDidMount() {
        this.countPurgableTracks();
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

    listHistoricalDates = (date) => {
        this.setState({
            loadingHistoricalDates: true,
            loadedHistoricalDates: false
        });
        fetch("." + ZUUL_ROUTE + "/track/historical/" + date)
            .then(handleRestResponse)
            .then(
                (result) => {
                    this.setState({
                        activeItem: date
                    });
                    this.props.setActiveSongList(result);
                },
                (error) => {
                    error.text().then(errorMessage => toast.error(<div>Failed to load historical
                        songs for {date}:<br/>{errorMessage}</div>));
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

    _isActive = (item) => this.state.activeItem === item;

    render() {
        return (<Menu vertical>
                <Menu.Item
                    name={SONGS}
                    active={this._isActive(SONGS)}
                    onClick={() => {
                        this.setState({
                            activeItem: SONGS
                        });
                        return this.props.setActiveSongList(this.props.songs);
                    }}
                >
                    Music
                </Menu.Item>
                <Dropdown item scrolling text='Historical plays'>
                    <Dropdown.Menu>
                        {this.props.historicalDates && this.props.historicalDates.map(hd =>
                            <Dropdown.Item text={hd}
                                           onClick={() => this.listHistoricalDates(hd)}
                                           key={hd}
                                           active={this._isActive(hd)}
                            />)
                        }
                    </Dropdown.Menu>
                </Dropdown>
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
                        </Menu.Menu>
                    </Menu.Item>
                }
            </Menu>
        )
    }
}

export default NavigatorComponent;