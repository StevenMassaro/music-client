import React, {Component} from 'react';
import './App.css';
import ReactTable from "react-table";
import "react-table/react-table.css";


class UpNextComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <span>
                <button onClick={() => this.props.modifyUpNext([])}>Clear up next</button>
                <ReactTable
                    data={this.props.upNext}
                    pivotBy={[
                        // 'artist'
                        // 'artist', 'album'
                        // 'album'
                    ]}
                    columns={[
                        // {
                        //     Header: "D",
                        //     accessor: "discNumber",
                        //     maxWidth: 25
                        // },
                        // {
                        //     Header: "T",
                        //     accessor: "trackNumber",
                        //     maxWidth: 50
                        // },
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
                        // {
                        //     Header: "Genre",
                        //     accessor: "genre",
                        //     maxWidth: 175
                        // },
                        // {
                        //     Header: "Plays",
                        //     accessor: "playCounter",
                        //     maxWidth: 50
                        // },
                        // {
                        //     Header: "Rating",
                        //     accessor: "rating",
                        //     maxWidth: 50
                        // }
                    ]}
                    defaultPageSize={1000}
                    minRows={0}
                    noDataText={"No songs in up next."}
                    filterable={true}
                    className="-striped -highlight"
                    defaultFilterMethod={this.props.defaultFilterMethod}
                />
            </span>
        )
    }

}

export default UpNextComponent;