import React, {Component} from 'react';
import './App.css';
import ReactTable from "react-table";
import "react-table/react-table.css";
import {ContextMenu, ContextMenuTrigger, MenuItem} from "react-contextmenu";


class UpNextComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showContextMenu: false,
            clickedData: undefined
        };
    }

    _getOrig = () => this.state.clickedData ? this.state.clickedData.original : null;

    _getTitle = () => this._getOrig() ? this._getOrig().title : null;

    _getIndex = () => this.state.clickedData ? this.state.clickedData.index : null;

    render() {
        return (
            <span>
                <ContextMenuTrigger id="upNextMenu">
                <ReactTable
                    data={this.props.upNext}
                    getTdProps={(state, rowInfo) => {
                        return {
                            onContextMenu:()=>{
                                this.setState({showContextMenu:true, clickedData: rowInfo});
                            }
                        };
                    }}
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
                </ContextMenuTrigger>
                <ContextMenu id='upNextMenu'>
                    <MenuItem data={this.state.clickedData}
                              onClick={() => this.props.removeFromUpNext(this._getIndex())}>
                        <div className="green">Remove '{this._getTitle()}'</div>
                    </MenuItem>
                    <MenuItem data={this.state.clickedData}
                              onClick={() => this.props.modifyUpNext([])}>
                        <div className="green">Clear up next</div>
                    </MenuItem>
                </ContextMenu>
            </span>
        )
    }

}

export default UpNextComponent;