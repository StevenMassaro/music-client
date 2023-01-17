import React, {Component} from 'react';
import './App.css';
import "react-table/react-table.css";
import 'react-contexify/dist/ReactContexify.css';
import {Track} from "./types/Track";
import {Divider, Grid} from 'semantic-ui-react';
import AlbumArtComponent from "./AlbumArtComponent";
import {Settings} from "./types/Settings";

type props = {
    upNextEntry: Track,
    buildServerUrl: (relativePath: string) => string,
    settings: Settings,
    isPlaying: boolean,
    isFutureSong: boolean,
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
        return (<span style={{opacity: (this.props.isPlaying || this.props.isFutureSong) ? "100%" : "40%"}}><Grid columns={2}>
                <Grid.Column width={4}>
                    <AlbumArtComponent
                        artSize={"Fill"}
                        settings={this.props.settings}
                        id={this.props.upNextEntry.id}
                        buildServerUrl={this.props.buildServerUrl}/>
                </Grid.Column>
                <Grid.Column>
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
            </Grid>
            <Divider />
            </span>
        );
    }

}

export default UpNextEntryComponent;