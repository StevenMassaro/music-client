import React, {Component} from 'react';
import './App.css';
import ReactTable from "react-table";
import "react-table/react-table.css";

class SongListComponent extends Component {

    render() {

        const {error, loadedSongs, songs} = this.props;

        return (
            <div>
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
                            accessor: "playCounter",
                            maxWidth: 50
                        },
                        {
                            Header: "Rating",
                            accessor: "rating",
                            maxWidth: 50
                        }
                    ]}
                    defaultPageSize={1000}
                    minRows={0}
                    noDataText={loadedSongs ? (error ? error : "No songs in database.") : "Loading songs..."}
                    filterable={true}
                    className="-striped -highlight"
                    defaultFilterMethod={this.props.defaultFilterMethod}

                />
            </div>

        );
    }
}

export default SongListComponent;
