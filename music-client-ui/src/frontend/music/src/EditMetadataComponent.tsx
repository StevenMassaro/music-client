import React, {Component} from 'react';
import './App.css';
import {toast} from "react-toastify";
import * as lodash from "lodash";
import {api} from "./App";
import {Track} from "./types/Track";
import {AxiosResponse} from "axios";

type props = {
    song: Track,
    listSongs: () => void,
    buildServerUrl: (relativePath: string) => string,
}

type state = {
    song: Track,
    modifyableTags: any[]
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
        api.get(this.props.buildServerUrl("/track/modifyabletags"))
            .then(
                (result: AxiosResponse) => {
                    this.setState({
                        modifyableTags: result.data
                    });
                });
    };

    handleSubmit = (event: React.FormEvent<HTMLFormElement>, song: Track) => {
        let songCopy = Object.assign({}, song);
        delete songCopy.target;
        api.patch(this.props.buildServerUrl("/track"), songCopy)
            .then(
                () => {
                    toast.success("Successfully updated track metadata.");
                    this.props.listSongs();
                });
        event.preventDefault();
    };

    handleInputChange = (propertyName: lodash.PropertyPath, value: string) => {
        let song = Object.assign({}, this.state.song);
        lodash.set(song, propertyName, value);
        this.setState({
            song: song
        });
    };

    render() {
        return <form onSubmit={(e) => this.handleSubmit(e, this.state.song)}>
            {this.state.modifyableTags.map(mt =>
                <span>
                    {mt.propertyName}: <input
                    type={mt.htmlType}
                    value={lodash.get(this.state.song, mt.propertyName, "")}
                    onChange={(e) => this.handleInputChange(mt.propertyName, e.target.value)}
                />
                <br/>
                </span>
            )}
            <input type="submit" value="Submit"/>
        </form>;
    }
}

export default EditMetadataComponent;