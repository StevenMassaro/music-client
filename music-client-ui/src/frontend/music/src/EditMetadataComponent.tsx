import React, {Component} from 'react';
import './App.css';
import {toast} from "react-toastify";
import * as lodash from "lodash";
import {TrackApi} from "./App";
import {Form} from "semantic-ui-react";
import {ModifyableTags, Track} from "./server-api";

type props = {
    song: Track,
    listSongs: () => void,
    buildServerUrl: (relativePath: string) => string,
}

type state = {
    song: Track,
    modifyableTags: ModifyableTags[]
}

class EditMetadataComponent extends Component<props, state> {

    constructor(props: props) {
        super(props);
        let songCopy = Object.assign({}, props.song);
        this.state = {
            modifyableTags: [],
            song: songCopy
        }
    }

    componentDidMount() {
        this.loadModifyableTags();
    }

    loadModifyableTags = () => {
        TrackApi.listModifyableTagsUsingGET()
            .then(
                (result: ModifyableTags[]) => {
                    this.setState({
                        modifyableTags: result
                    });
                });
    };

    handleSubmit = (event: React.FormEvent<HTMLFormElement>, song: Track) => {
        let songCopy = Object.assign({}, song);
        // delete songCopy.target;
        TrackApi.updateTrackInfoUsingPATCH(songCopy)
            .then(
                () => {
                    toast.success("Successfully updated track metadata.");
                    this.props.listSongs();
                });
        event.preventDefault();
    };

    handleInputChange = (propertyName: string, value: string) => {
        let song = Object.assign({}, this.state.song);
        lodash.set(song, propertyName, value);
        this.setState({
            song: song
        });
    };

    render() {
        return <Form
            onSubmit={(e) => this.handleSubmit(e, this.state.song)}
            loading={lodash.isEmpty(this.state.modifyableTags)}
        >
            {this.state.modifyableTags.map(mt =>
                    <Form.Field>
                        <Form.Input
                            label={mt.propertyName}
                            type={mt.htmlType!.toString()}
                            onChange={(e) => this.handleInputChange(mt.propertyName!, e.target.value)}
                            value={lodash.get(this.state.song, mt.propertyName!, "")}
                            width={6}
                        />
                    </Form.Field>
            )}
            <Form.Button content='Submit' />
        </Form>;
    }
}

export default EditMetadataComponent;