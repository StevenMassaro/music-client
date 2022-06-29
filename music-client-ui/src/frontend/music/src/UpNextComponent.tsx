import React, {Component} from 'react';
import './App.css';
import ReactTable from "react-table";
import "react-table/react-table.css";
import {Item, Menu, useContextMenu, TriggerEvent} from "react-contexify";
import 'react-contexify/dist/ReactContexify.css';
import {Track} from "./types/Track";
import {defaultFilterMethod} from "./Utils";

type props = {
    upNext: Track[],
    moveInUpNext: (indexA: number, offset: number) => void,
    modifyUpNext: (newUpNext: Track[]) => void,
    removeFromUpNext: (index: number) => void
}

type state = {
    clickedData: any
}

class UpNextComponent extends Component<props, state> {
    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
            clickedData: undefined
        };
    }

    _getOrig = () => this.state.clickedData ? this.state.clickedData.original : null;

    _getTitle = () => this._getOrig() ? this._getOrig().title : null;

    _getIndex = () => this.state.clickedData ? this.state.clickedData.index : null;

    _shouldRenderMoveDown = () => this.props.upNext && this._getIndex() < this.props.upNext.length - 1;

    _handleContextMenu = (event: TriggerEvent)  => {
        const {show} = useContextMenu({
            id: 'upNextMenu',
        });
        show(event)
    }

    render() {
        return (
            <span>
                <ReactTable
                    resizable={false}
                    data={this.props.upNext}
                    getTdProps={(state: any, rowInfo: any) => {
                        return {
                            onContextMenu: (e: any) => {
                                e.preventDefault();
                                this._handleContextMenu(e);
                                this.setState({clickedData: rowInfo});
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
                    defaultPageSize={50}
                    minRows={0}
                    noDataText={"No songs in up next."}
                    filterable={true}
                    sortable={false}
                    className="-striped -highlight"
                    defaultFilterMethod={defaultFilterMethod}
                />
                <Menu id='upNextMenu'>
                    {this._getIndex() > 0 &&
                    <Item onClick={() => this.props.moveInUpNext(this._getIndex(), 1)}>
                        <div className="green">Move '{this._getTitle()}' up</div>
                    </Item>
                    }
                    {this._shouldRenderMoveDown() &&
                    <Item onClick={() => this.props.moveInUpNext(this._getIndex(), -1)}>
                        <div className="green">Move '{this._getTitle()}' down</div>
                    </Item>
                    }
                    <Item onClick={() => this.props.removeFromUpNext(this._getIndex())}>
                        <div className="green">Remove '{this._getTitle()}'</div>
                    </Item>
                    <Item onClick={() => this.props.modifyUpNext([])}>
                        <div className="green">Clear up next</div>
                    </Item>
                </Menu>
            </span>
        )
    }

}

export default UpNextComponent;
