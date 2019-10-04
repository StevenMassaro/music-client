import React, {Component} from 'react';
import './App.css';
import ReactTable from "react-table";
import "react-table/react-table.css";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";
import './react-contextmenu.css';

class SongListComponent extends Component {

    constructor(props){
        super(props);
        this.state = {
            showContextMenu: false,
            clickedData: undefined
        };
    }

    render() {

        const {error, loadedSongs, songs} = this.props;

        return (
            <div>
                <ContextMenuTrigger id="menu_id">
                    <ReactTable
                        data={songs}
                        pivotBy={[
                            // 'artist'
                            // 'artist', 'album'
                            // 'album'
                        ]}
                        getTdProps={(state, rowInfo, column, instance) => {
                            return {
                                onClick: (e, handleOriginal) => {
                                    this.props.addToPlaylist(rowInfo.original);
                                    // IMPORTANT! React-Table uses onClick internally to trigger
                                    // events like expanding SubComponents and pivots.
                                    // By default a custom 'onClick' handler will override this functionality.
                                    // If you want to fire the original onClick handler, call the
                                    // 'handleOriginal' function.
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
                                accessor: "discNumber",
                                maxWidth: 25
                            },
                            {
                                Header: "T",
                                accessor: "trackNumber",
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
                            }
                        ]}
                        defaultPageSize={10000}
                        minRows={0}
                        noDataText={loadedSongs ? (error ? error : "No songs in database.") : "Loading songs..."}
                        filterable={true}
                        className="-striped -highlight"
                        defaultFilterMethod={this.props.defaultFilterMethod}

                    />
                </ContextMenuTrigger>
                <ContextMenu id='menu_id'>
                    <MenuItem data={this.state.clickedData}
                              onClick={(e,props) => this.props.deleteSong(props.id)}>
                        <div className="green">Delete '{this.state.clickedData ? this.state.clickedData.title : null}'</div>
                    </MenuItem>
                </ContextMenu>
            </div>
        );
    }
}

export default SongListComponent;
