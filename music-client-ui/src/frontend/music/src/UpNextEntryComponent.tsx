import React, {Component} from 'react';
import './App.css';
import "react-table/react-table.css";
import 'react-contexify/dist/ReactContexify.css';
import {Track} from "./types/Track";
import {Divider, Grid, Icon} from 'semantic-ui-react';
import AlbumArtComponent from "./AlbumArtComponent";
import {Settings} from "./types/Settings";

type props = {
    upNextEntry: Track,
    buildServerUrl: (relativePath: string) => string,
    settings: Settings,
    isPlaying: boolean,
    isFutureSong: boolean,
    isFirst: boolean,
    isLast: boolean,
    moveInUpNext: (indexA: number, offset: number) => void,
    removeFromUpNext: (index: number) => void,
    currentMusicIndex: number,
    shouldRender: boolean,
    index: number,
}

type state = {
}

class UpNextEntryComponent extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
        };
    }

    render() {
        return (this.props.shouldRender &&
            <span style={{opacity: (this.props.isPlaying || this.props.isFutureSong) ? "100%" : "40%"}}>
                <Grid columns={2}>
                    <Grid.Column width={4}>
                        <AlbumArtComponent
                            artSize={"Fill"}
                            settings={this.props.settings}
                            id={this.props.upNextEntry.id}
                            buildServerUrl={this.props.buildServerUrl}/>
                    </Grid.Column>
                    <Grid.Column width={10}>
                        <Grid.Row>
                            {this.props.upNextEntry.title}
                        </Grid.Row>
                        <Grid.Row>
                            {this.props.upNextEntry.artist}
                        </Grid.Row>
                        <Grid.Row>
                            {this.props.upNextEntry.album}
                        </Grid.Row>
                    </Grid.Column>
                    <Grid.Column width={2}>
                        <Grid.Row>
                            <Icon name='arrow up' disabled={this.props.isFirst} onClick={() => this.props.moveInUpNext(this.props.index, 1)}/>
                        </Grid.Row>
                        <Grid.Row>
                            <Icon name='trash alternate' onClick={() => this.props.removeFromUpNext(this.props.index)}/>
                        </Grid.Row>
                        <Grid.Row>
                            <Icon name='arrow down' disabled={!this.props.isLast} onClick={() => this.props.moveInUpNext(this.props.index, -1)}/>
                        </Grid.Row>
                    </Grid.Column>
                </Grid>
                <Divider />
            </span>
        );
    }

}

export default UpNextEntryComponent;