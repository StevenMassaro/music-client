import {Component} from 'react';
import * as React from 'react';
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import * as lodash from "lodash";
import {api} from "./App";
import {toTime} from "./Utils";
import ReactTable from "react-table";
import "react-table/react-table.css";
import moment from 'moment';
import {Button} from 'semantic-ui-react'
import './PurgableSongsComponent.css';
import selectTableHOC from "react-table/lib/hoc/selectTable";

const SelectTable = selectTableHOC(ReactTable);

type props = {
    buildServerUrl: (url: string) => string
}

type state = {
    purgableTracks?: any[],
    selectedTracks: any[],
    selectAll: boolean
}

export class PurgableSongsComponent extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
            purgableTracks: undefined,
            selectedTracks: [],
            selectAll: false
        }
    }

    componentDidMount(): void {
        this.listPurgableTracks();
    }

    purgeTracks = () => {
        let purgingMessage = toast.info("Purging deleted tracks", {
            autoClose: false,
            hideProgressBar: true
        });
        api.delete(this.props.buildServerUrl("/admin/purge"), {data: this.state.selectedTracks.map(x => x.id)})
            .then(
                () => {
                    toast.dismiss(purgingMessage);
                    toast.success("Successfully purged deleted tracks.");
                    this.listPurgableTracks();
                });
    };

    listPurgableTracks = () => {
        api.get(this.props.buildServerUrl("/admin/purge"))
            .then(
                (result) => {
                    this.setState({
                        purgableTracks: result.data
                    });
                });
    };

    /**
     * returns true if the key passed is selected otherwise it should return false
     */
    isSelected = (key: string) => {
        return !lodash.isUndefined(this.state.selectedTracks.find((track) => {
            return track.id == key;
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
        const id = splits[1];
        if (this.isSelected(id)) { // todo the key is coming in with some additional data, so we need to split it here or something
            this.setState((state) => ({
                selectedTracks: state.selectedTracks.filter((track) => {
                    return track.id != id;
                })
            }));
        } else {
            this.setState((state) => ({
                selectedTracks: [...state.selectedTracks, state.purgableTracks!.find((track) => {
                    return track.id == id
                })]
            }));
        }
    };

    render() {
        return (
            <div>
                {!lodash.isUndefined(this.state.purgableTracks) && !lodash.isEmpty(this.state.purgableTracks) ?
                <span>
                <Button
                    negative
                    onClick={this.purgeTracks}>
                    Purge {this.state.selectedTracks.length} selected track{this.state.selectedTracks.length != 1 ? "s" : ""} in list
                </Button>
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
                    className="-striped -highlight"
                />
                    </span> : <span>No tracks to purge.</span>}
            </div>
        );
    }
}
