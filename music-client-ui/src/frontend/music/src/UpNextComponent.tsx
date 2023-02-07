import React, {Component} from 'react';
import './App.css';
import "react-table/react-table.css";
import 'react-contexify/dist/ReactContexify.css';
import {Track} from "./types/Track";
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
}

const backwardsLookCount = 1;
const maxUpNextEntriesToRender = 10;

class UpNextComponent extends Component<props, state> {
    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
        };
    }

    isLast = (index: number) => this.props.upNext && index < this.props.upNext.length - 1;

    isPlaying = (index: number) => {
        return index === this.props.currentMusicIndex;
    }

    isFuture = (index: number) => {
        return index > this.props.currentMusicIndex;
    }

    isFirst = (index: number) => {
        return index === 0;
    }

    shouldRender = (index: number) => {
        const subtractor = Math.min(this.props.currentMusicIndex, backwardsLookCount);
        return (index >= this.props.currentMusicIndex - subtractor) && (index < this.props.currentMusicIndex + maxUpNextEntriesToRender);
    }

    render() {
        return (
            this.props.upNext.map((upNextEntry, index) => {
                return <UpNextEntryComponent
                    upNextEntry={upNextEntry}
                    buildServerUrl={this.props.buildServerUrl}
                    settings={this.props.settings}
                    isPlaying={this.isPlaying(index)}
                    isFutureSong={this.isFuture(index)}
                    isFirst={this.isFirst(index)}
                    isLast={this.isLast(index)}
                    currentMusicIndex={this.props.currentMusicIndex}
                    shouldRender={this.shouldRender(index)}
                    moveInUpNext={this.props.moveInUpNext}
                    removeFromUpNext={this.props.removeFromUpNext}
                    index={index}
                />
            })
        )
    }

}

export default UpNextComponent;
