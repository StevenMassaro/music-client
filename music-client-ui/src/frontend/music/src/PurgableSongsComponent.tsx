import {Component} from 'react';
import * as React from 'react';
import {toast} from "react-toastify";
import * as lodash from "lodash";
import {AdminApi} from "./App";
import {toTime} from "./Utils";
import ReactTable from "react-table";
import "react-table/react-table.css";
import moment from 'moment';
import {Button} from 'semantic-ui-react'
import './PurgableSongsComponent.css';
import selectTableHOC from "react-table/lib/hoc/selectTable";
import {DropdownListComponent} from "./navigation/common";
import {MenuItem} from "./types/MenuItem";
import {Library, Track} from "./server-api";

const SelectTable = selectTableHOC(ReactTable);

type props = {
    buildServerUrl: (url: string) => string
}

type state = {
    purgableTracks?: any[],
    selectedTracks: any[],
    selectAll: boolean,
    destinationTrack?: Track,
    activeItem?: MenuItem
}

export class PurgableSongsComponent extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
            purgableTracks: undefined,
            selectedTracks: [],
            selectAll: false,
            destinationTrack: undefined,
            activeItem: new MenuItem("", undefined)
        }
    }

    componentDidMount(): void {
        this.listPurgableTracks();
    }

    purgeTracks = () => {
        const count = this.state.selectedTracks.length;
        if (count === 1 && !lodash.isUndefined(this.state.destinationTrack)) {
            let idToDelete: any[] = this.state.selectedTracks.map(x => x.id);
            let destinationId = this.state.destinationTrack?.id;
            let purgingMessage = toast.info(`Purging track ID ${idToDelete} into ${destinationId}.`, {
                autoClose: false,
                hideProgressBar: true
            });
            // @ts-ignore
            AdminApi.purgeIntoUsingDELETE(destinationId, idToDelete).then(
                    () => {
                        toast.dismiss(purgingMessage);
                        toast.success(`Successfully purged track ID ${idToDelete}.`);
                        this.listPurgableTracks();
                    });
        } else {
            const pluralizedString = count > 1 ? 's' : '';
            let purgingMessage = toast.info(`Purging ${count} deleted track${pluralizedString}`, {
                autoClose: false,
                hideProgressBar: true
            });
            AdminApi.purgeDeletedTracksUsingDELETE(this.state.selectedTracks.map(x => x.id))
                .then(
                    () => {
                        toast.dismiss(purgingMessage);
                        toast.success(`Successfully purged ${count} deleted track${pluralizedString}.`);
                        this.listPurgableTracks();
                    });
        }
    };

    listPurgableTracks = () => {
        AdminApi.listPurgableTracksUsingGET()
            .then(
                (result: Track[]) => {
                    this.setState({
                        purgableTracks: result,
                        selectedTracks: []
                    });
                });
    };

    /**
     * returns true if the key passed is selected otherwise it should return false
     */
    isSelected = (key: string) => {
        return !lodash.isUndefined(this.state.selectedTracks.find((track) => {
            return !lodash.isUndefined(track) && track.id === lodash.toInteger(key);
        }))
    };

    /**
     * called when the user clicks the selectAll checkbox/radio
     */
    toggleAll = () => {
        let {selectedTracks, purgableTracks} = this.state;
        if (lodash.isEmpty(selectedTracks)) {
            this.setState({
                selectedTracks: purgableTracks!
            });
        } else if(lodash.isEqual(selectedTracks, purgableTracks)) {
            this.setState({
                selectedTracks: []
            });
        } else {
            this.setState({
                selectedTracks: purgableTracks!
            });
        }
    };

    /**
     * called when the use clicks a specific checkbox/radio in a row
     */
    toggleSelection = (key: string) => {
        const splits = key.split("-");
        const id = lodash.toInteger(splits[1]);
        if (this.isSelected(id.toString())) { // todo the key is coming in with some additional data, so we need to split it here or something
            this.setState((state) => ({
                selectedTracks: state.selectedTracks.filter((track) => {
                    return track.id !== id;
                })
            }));
        } else {
            this.setState((state) => ({
                selectedTracks: [...state.selectedTracks, state.purgableTracks!.find((track) => {
                    return track.id === id
                })]
            }));
        }
        this.setState({
            destinationTrack: undefined
        });
    };

    handleDestinationTrackIdChange = (destinationTrack: Track) => {
        this.setState({destinationTrack: destinationTrack});
    }

    _setActiveMenuItem = (name: string, library?: Library, callback?: (() => void) | undefined) => {
        this.setState({activeItem: new MenuItem(name, library)});
    };

    render() {
        return (
            <div>
                {!lodash.isUndefined(this.state.purgableTracks) && !lodash.isEmpty(this.state.purgableTracks) ?
                <span>
                <Button
                    negative
                    onClick={this.purgeTracks}>
                    {this.state.destinationTrack ?
                        <span>Purge {this.state.selectedTracks[0].title} into existing track {this.state.destinationTrack?.title}</span> :
                        <span>Purge {this.state.selectedTracks.length} selected track{this.state.selectedTracks.length !== 1 ? "s" : ""} in list</span>
                    }
                </Button>
                {this.state.selectedTracks.length === 1 &&
                    <span>
                        <DropdownListComponent
                            activeMenuItem={this.state.activeItem!}
                            title={"Select track to purge into"}
                            valuesUrl={"/track"}
                            setActiveMenuItem={this._setActiveMenuItem}
                            valueGetter={(value: Track) => value.id}
                            textGetter={(value: Track) => value.title + " - " + value.artist + " - " + value.album}
                            dropdownOnClickCallback={(value: Track) => this.handleDestinationTrackIdChange(value)}
                            buildServerUrl={this.props.buildServerUrl}
                            shouldListTracksOnClick={false}
                        />
                    </span>
                }
                <SelectTable
                    keyField="id"
                    // for some reason we need to define this method this way or it won't see the state
                    isSelected={(key => this.isSelected(key))}
                    selectAll={this.state.selectAll}
                    toggleAll={this.toggleAll}
                    toggleSelection={this.toggleSelection}
                    selectType={"checkbox"}
                    data={this.state.purgableTracks}
                    columns={[
                        {
                            Header: "D",
                            accessor: "disc_no",
                            maxWidth: 25
                        },
                        {
                            Header: "T",
                            accessor: "track",
                            maxWidth: 50
                        },
                        {
                            Header: "Title",
                            accessor: "title",
                            maxWidth: 175
                        },
                        {
                            Header: "Artist",
                            accessor: "artist",
                            maxWidth: 175
                        },
                        {
                            Header: "Album",
                            accessor: "album",
                            maxWidth: 175
                        },
                        {
                            Header: "Genre",
                            accessor: "genre",
                            maxWidth: 175
                        },
                        {
                            Header: "Plays",
                            accessor: "plays",
                            maxWidth: 50
                        },
                        {
                            Header: "Skips",
                            accessor: "skips",
                            maxWidth: 50
                        },
                        {
                            Header: "Rating",
                            accessor: "rating",
                            maxWidth: 50
                        },
                        {
                            Header: "Length",
                            accessor: "duration",
                            maxWidth: 50,
                            Cell: row => toTime(row.value)
                        },
                        {
                            Header: "Added",
                            accessor: "dateCreated",
                            maxWidth: 100,
                            Cell: row => moment(row.value).format("YYYY-MM-DD HH:mm")
                        }
                    ]}
                    defaultPageSize={100}
                    minRows={0}
                    noDataText={lodash.isUndefined(this.state.purgableTracks) ? "Loading purgable songs..." : "No songs to purge."}
                    filterable={true}
                    className="-striped -highlight PurgableSongsTable"
                />
                    </span> : <span>No tracks to purge.</span>}
            </div>
        );
    }
}
