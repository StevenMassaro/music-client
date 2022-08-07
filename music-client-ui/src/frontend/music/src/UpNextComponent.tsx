import React, {Component} from 'react';
import './App.css';
import ReactTable, {RowInfo} from "react-table";
import "react-table/react-table.css";
import {Item, Menu, useContextMenu, TriggerEvent} from "react-contexify";
import 'react-contexify/dist/ReactContexify.css';
import {Track} from "./types/Track";
import {defaultFilterMethod} from "./Utils";

type props = {
    upNext: Track[],
    moveInUpNext: (indexA: number, offset: number) => void,
    clearUpNext: (newUpNext: Track[]) => void,
    removeFromUpNext: (index: number) => void,
    currentMusicIndex: number
}

type state = {
    clickedData: any
}

const backwardsLookCount = 3;

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

    _getData = () => {
        const subtractor = this.props.currentMusicIndex < backwardsLookCount ? this.props.currentMusicIndex : backwardsLookCount;
        const start = this.props.currentMusicIndex > 0 ? this.props.currentMusicIndex - subtractor : 0;
        return this.props.upNext.slice(start)
    }

    getTrProps = (finalState: any, rowInfo?: RowInfo, column?: undefined, instance?: any) => {
        const playingIndex = Math.min(this.props.currentMusicIndex, backwardsLookCount);
        if (rowInfo && rowInfo.index === playingIndex) {
            return {
                style: {
                    // todo - change this to a light green once the track is marked played?
                    background: 'silver'
                }
            }
        }
        return {};
    }

    render() {
        return (
            <span>
                <ReactTable
                    resizable={false}
                    data={this._getData()}
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
                    getTrProps={this.getTrProps}
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
                    <Item onClick={() => this.props.clearUpNext([])}>
                        <div className="green">Clear up next</div>
                    </Item>
                </Menu>
            </span>
        )
    }

}

export default UpNextComponent;
