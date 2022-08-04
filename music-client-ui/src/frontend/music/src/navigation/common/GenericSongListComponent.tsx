import React, {Component} from 'react';
import * as lodash from "lodash";
import ReactTable, {RowInfo} from "react-table";
import {toTime} from "../../Utils";
import moment from 'moment';
import {Item, Menu, Submenu, Separator, useContextMenu, TriggerEvent} from "react-contexify";
import 'react-contexify/dist/ReactContexify.css';
import {Track} from "../../types/Track";
import {PlaylistRes} from "../../server-api";

type props = {
    activeSongList: Track[],
    activeSongListName: string | undefined,
    buildServerUrl: (url: string) => string,
    addToEndOfUpNext: (song: Track) => void,
    defaultFilterMethod: (filter: any, row: any, column: any) => boolean,
    shuffleSongs: (songs: Track[], selector: (song: Track) => Track) => void,
    playNext: (song: Track) => void,
    showInfo: (song: Track) => void,
    deleteSong: (id: number) => void,
    showUploadSongs: (id: number | undefined) => void,
    showEditAlbumArt: (song: Track) => void,
    showEditMetadata: (song: Track) => void,
    setRating: (id: number, rating: number) => void,
    playlists: PlaylistRes[],
    addToPlaylist: (playlist: PlaylistRes, track: Track) => void,
    listingSongs: boolean,
    downloadSong: (song: Track) => void,
}

type state = {
    clickedData?: Track,
    tableRef: any,
}

export class GenericSongListComponent extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
            clickedData: undefined,
            tableRef: null,
        }
    }

    _generateRatingList = () => {
        let ratingList = [];
        for (let i = 0; i < 11; i++) {
            ratingList.push(<Item
                key={`rating-${i}`}
                onClick={() => this.props.setRating(this.state.clickedData!.id, i)}>{i}</Item>);
        }
        return ratingList;
    };

    _generatePlaylistList = () => {
        return this.props.playlists.map(playlist => {
            return <Item
                key={`playlist-${playlist.id}`}
                onClick={() => this.props.addToPlaylist(playlist, this.state.clickedData!)}>{playlist.name}</Item>
        })
    };

    _getFilteredSongList = () => this.state.tableRef!.getResolvedState().sortedData;

    _filteredSongListSelector = (s: any) => s._original;

    _handleContextMenu = (event: TriggerEvent) => {
        const {show} = useContextMenu({
            id: 'menu_id',
        });
        show(event)
    }

    render() {
        const {activeSongList} = this.props;
        const headerHeight = "20px";
        return (
            <div>
                {!lodash.isUndefined(this.props.activeSongListName) && <div style={{"textAlign": "center", "height": headerHeight, "fontWeight": "bold"}}>{this.props.activeSongListName}</div>}
                <ReactTable
                    style={{"height": lodash.isUndefined(this.props.activeSongListName) ? "100%" : `calc(100% - ${headerHeight})`}}
                    data={activeSongList}
                    ref={(tableRef) => {
                        !this.state.tableRef &&
                        this.setState({
                            tableRef: tableRef
                        });
                    }}
                    getTdProps={(state: any, rowInfo?: RowInfo) => {
                        return {
                            onClick: (e: any, handleOriginal: () => void) => {
                                this.props.addToEndOfUpNext(rowInfo!.original);
                                if (handleOriginal) {
                                    handleOriginal();
                                }
                            },
                            onContextMenu: (e: any) => {
                                e.preventDefault();
                                this._handleContextMenu(e);
                                this.setState({clickedData: rowInfo!.original});
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
                            Cell: row => toTime(row.value)
                        },
                        {
                            Header: "Added",
                            accessor: "dateCreated",
                            maxWidth: 100,
                            Cell: row => moment(row.value).format("YYYY-MM-DD HH:mm")
                        },
                        {
                            Header: "Last played",
                            accessor: "lastPlayedDate",
                            maxWidth: 100,
                            Cell: row => row.value && moment(row.value).format("YYYY-MM-DD HH:mm")
                        }
                    ]}
                    defaultPageSize={100}
                    minRows={0}
                    noDataText={this.props.listingSongs ? "Loading songs..." : "No matching songs."}
                    filterable={true}
                    className="-striped -highlight"
                    defaultFilterMethod={this.props.defaultFilterMethod}

                />
                <Menu id='menu_id'>
                    <Item
                        onClick={() => this.props.shuffleSongs(this._getFilteredSongList(), this._filteredSongListSelector)}>
                        <div className="green">Shuffle visible</div>
                    </Item>
                    <Separator/>
                    <div><b>{this.state.clickedData ? this.state.clickedData.title : null}</b></div>
                    <Item onClick={() => this.props.playNext(this.state.clickedData!)}>
                        <div className="green">Play next</div>
                    </Item>
                    <Item onClick={() => this.props.showInfo(this.state.clickedData!)}>
                        <div className="green">Show info...</div>
                    </Item>
                    <Item onClick={() => this.props.downloadSong(this.state.clickedData!)}>
                        <div className="green">Download</div>
                    </Item>
                    <Item onClick={() => this.props.showEditMetadata(this.state.clickedData!)}>
                        <div className="green">Edit...</div>
                    </Item>
                    <Item onClick={() => this.props.showEditAlbumArt(this.state.clickedData!)}>
                        <div className="green">Edit album art...</div>
                    </Item>
                    <Submenu label="Rate">
                        {this._generateRatingList()}
                    </Submenu>
                    {!lodash.isEmpty(this.props.playlists) &&
                        <Submenu label="Add to playlist">
                            {this._generatePlaylistList()}
                        </Submenu>
                    }
                    <Item onClick={() => this.props.showUploadSongs(this.state.clickedData!.id)}>
                        <div className="green">Replace track...</div>
                    </Item>
                    <Item onClick={() => this.props.deleteSong(this.state.clickedData!.id)}>
                        <div className="green">Delete</div>
                    </Item>
                </Menu>
            </div>
        );
    }
}
