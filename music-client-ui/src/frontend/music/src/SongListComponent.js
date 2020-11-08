import React, {Component} from 'react';
import './App.css';
import ReactTable from "react-table";
import "react-table/react-table.css";
import {ContextMenu, ContextMenuTrigger, MenuItem, SubMenu} from "react-contextmenu";
import './react-contextmenu.css';
import * as moment from 'moment';
import {toast} from "react-toastify";
import {api} from "./App";

class SongListComponent extends Component {

    constructor(props){
        super(props);
        this.state = {
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

    _generateRatingList = () => {
        let ratingList = [];
        for (let i = 0; i < 11; i++) {
            ratingList.push(<MenuItem
                data={this.state.clickedData}
                key={i}
                onClick={(e, props) => this._setRating(props.id, i)}>{i}</MenuItem>);
        }
        return ratingList;
    };

    _setRating = (id, rating) => {
        api.patch(this.props.buildServerUrl("/track/" + id + "/rating/" + rating))
            .then(() => {
                let songsCopy = Object.assign([], this.props.songs);
                let songCopy = songsCopy.find(song => song.id === id);
                songCopy.rating = rating;
                this.props.modifySongs(songsCopy);
                toast.success(`Successfully set rating of ${rating} for song.`);
            })
    };

    render() {

        const {error, loadedSongs, activeSongList} = this.props;

        return (
            <div>
                <ContextMenuTrigger id="menu_id">
                    <ReactTable
                        data={activeSongList}
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
                                    this.setState({clickedData: rowInfo.original});
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
                              onClick={(e,props) => this.props.showEditAlbumArt(props)}>
                        <div className="green">Edit album art</div>
                    </MenuItem>
                    <SubMenu title="Rate">
                        {this._generateRatingList()}
                    </SubMenu>
                    <MenuItem data={this.state.clickedData}
                              onClick={(e,props) => this.props.showUploadSongs(props.id)}>
                        <div className="green">Replace track</div>
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
