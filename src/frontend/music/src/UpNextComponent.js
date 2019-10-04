import React, {Component} from 'react';
import './App.css';
import ReactTable from "react-table";
import "react-table/react-table.css";
import {ContextMenu, MenuItem} from "react-contextmenu";


class UpNextComponent extends Component {
    render() {
        return (
            <span>
                <button onClick={() => this.props.modifyUpNext([])}>Clear up next</button>
                <ReactTable
                    data={this.props.upNext}
                    columns={[
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