import React, {Component} from 'react';
import './App.css';
import ReactTable, {RowInfo} from "react-table";
import "react-table/react-table.css";
import {Item, Menu, useContextMenu, TriggerEvent} from "react-contexify";
import 'react-contexify/dist/ReactContexify.css';
import {Track} from "./types/Track";
import {defaultFilterMethod} from "./Utils";
import UpNextEntryComponent from "./UpNextEntryComponent";
import {Settings} from "./types/Settings";

type props = {
    upNext: Track[],
    moveInUpNext: (indexA: number, offset: number) => void,
    clearUpNext: (newUpNext: Track[]) => void,
    removeFromUpNext: (index: number) => void,
    currentMusicIndex: number,
    buildServerUrl: (relativePath: string) => string,
    settings: Settings,
}

type state = {
    clickedData: any
}

const backwardsLookCount = 3;
const maxUpNextEntriesToRender = 10;

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

    isPlaying = (index: number) => {
        return index === this.currentPlayingIndex();
    }

    isFuture = (index: number) => {
        return index > this.currentPlayingIndex();
    }

    currentPlayingIndex = () => {
        return Math.min(this.props.currentMusicIndex, backwardsLookCount);
    }

    render() {
        return (
            this._getData().slice(0, maxUpNextEntriesToRender).map((upNextEntry, index) => {
                return <UpNextEntryComponent
                    upNextEntry={upNextEntry}
                    buildServerUrl={this.props.buildServerUrl}
                    settings={this.props.settings}
                    isPlaying={this.isPlaying(index)}
                    isFutureSong={this.isFuture(index)}
                />
            })
        )
    }

}

export default UpNextComponent;
