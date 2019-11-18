import React, {Component} from 'react';
import './App.css';
import ReactTable from "react-table";
import "react-table/react-table.css";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import './react-contextmenu.css';
import * as moment from 'moment';

class SongListComponent extends Component {

    constructor(props){
        super(props);
        this.state = {
            showContextMenu: false,
            clickedData: undefined
        };
    }

    _getFilteredSongList = () => this.state.tableRef.getResolvedState().sortedData;

    _filteredSongListSelector = (s) => s._original;

    _toTime = (inputSeconds) => {
        let sec_num = parseInt(inputSeconds, 10); // don't forget the second param
        let hours   = Math.floor(sec_num / 3600);
        let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        let seconds = sec_num - (hours * 3600) - (minutes * 60);

        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        if (hours > 0){
            return hours+':'+minutes+':'+seconds;
        }
        return minutes+':'+seconds;
    };

    render() {

        const {error, loadedSongs, songs} = this.props;

        return (
            <div>
                <ContextMenuTrigger id="menu_id">
                    <ReactTable
                        data={songs}
                        ref={(tableRef) => {
                            !this.state.tableRef &&
                            this.setState({
                                tableRef
                            });
                        }}
                        getTdProps={(state, rowInfo) => {
                            return {
                                onClick: (e, handleOriginal) => {
                                    this.props.addToEndOfUpNext(rowInfo.original);
                                    if (handleOriginal) {
                                        handleOriginal();
                                    }
                                },
                                onContextMenu:()=>{
                                    this.setState({showContextMenu:true, clickedData: rowInfo.original});
                                }
                            };
                        }}
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
                                Header: "Rating",
                                accessor: "rating",
                                maxWidth: 50
                            },
                            {
                                Header: "Length",
                                accessor: "duration",
                                maxWidth: 50,
                                Cell: row => this._toTime(row.value)
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
                        noDataText={loadedSongs ? (error ? error : "No songs in database.") : "Loading songs..."}
                        filterable={true}
                        className="-striped -highlight"
                        defaultFilterMethod={this.props.defaultFilterMethod}

                    />
                </ContextMenuTrigger>
                <ContextMenu id='menu_id'>
                    <MenuItem data={this.state.clickedData}
                              onClick={() => this.props.shuffleSongs(this._getFilteredSongList(), this._filteredSongListSelector)}>
                        <div className="green">Shuffle visible</div>
                    </MenuItem>
                    <MenuItem divider />
                    <div><b>{this.state.clickedData ? this.state.clickedData.title : null}</b></div>
                    <MenuItem data={this.state.clickedData}
                              onClick={(e,props) => this.props.playNext(props)}>
                        <div className="green">Play next</div>
                    </MenuItem>
                    <MenuItem data={this.state.clickedData}
                                onClick={(e,props) => this.props.showInfo(props)}>
                        <div className="green">Show info</div>
                    </MenuItem>
                    <MenuItem data={this.state.clickedData}
                              onClick={(e,props) => this.props.showEditMetadata(props)}>
                        <div className="green">Edit</div>
                    </MenuItem>
                    <MenuItem data={this.state.clickedData}
                              onClick={(e,props) => this.props.deleteSong(props.id)}>
                        <div className="green">Delete</div>
                    </MenuItem>
                </ContextMenu>
            </div>
        );
    }
}

export default SongListComponent;
