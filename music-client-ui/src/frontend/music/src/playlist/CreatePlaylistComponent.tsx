import React, {Component} from 'react';
import 'semantic-ui-css/semantic.min.css';
import {toast} from "react-toastify";
import * as lodash from "lodash";
import {api} from "../App";
import {SmartPlaylist} from "../types/SmartPlaylist";
import {Playlist} from "../types/Playlist";

export enum PlaylistTypeEnum {
    default = "playlist",
    smart = "smart playlist"
}

type props = {
    playlistType: PlaylistTypeEnum,
    buildServerUrl: (url: string) => string,
    existingPlaylist: SmartPlaylist | Playlist | undefined,
}

type state = {
    playlist: SmartPlaylist | Playlist | undefined,
    action: string
}

class CreatePlaylistComponent extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        let existing = Object.assign({}, this.props.existingPlaylist);
        this.state = {
            playlist: existing,
            action: this.props.existingPlaylist ? "update" : "create"
        }
    }

    handleSubmit = (event: React.FormEvent<HTMLFormElement>, playlist: any) => {
        api({
            url: this.props.buildServerUrl(this._getEndpointPath()),
            method: this.props.existingPlaylist ? "PATCH" : "POST",
            data: playlist
        })
            .then(() => {
                toast.success(`Successfully ${this.state.action}d ${this.props.playlistType}.`);
            });
        event.preventDefault();
    };

    handleInputChange = (propertyName: string, value: string) => {
        let playlist = Object.assign({}, this.state.playlist);
        lodash.set(playlist, propertyName, value);
        this.setState({
            playlist: playlist
        });
    };

    deleteEntry = () => {
        api.delete(this.props.buildServerUrl(this._getEndpointPath() + this.props.existingPlaylist!.id))
            .then(() => toast.success(`Successfully deleted ${this.props.playlistType}.`))
            .catch(() => {
                toast.error(`Failed to delete ${this.props.playlistType}`);
            });
    };

    _getEndpointPath = () => {
        return this.props.playlistType === PlaylistTypeEnum.smart ? "/playlist/smart" : "/playlist"
    }

    render() {
        const name = "name";
        const dynamicSql = "dynamicSql";
        return <>
            <form onSubmit={(e) => this.handleSubmit(e, this.state.playlist)}>
                <span>
                    Name: <input
                    type={"text"}
                    value={lodash.get(this.state.playlist, name, "")}
                    onChange={(e) => this.handleInputChange(name, e.target.value)}
                />
                    {this.props.playlistType === PlaylistTypeEnum.smart && <span>
                         <br/>
                Dynamic SQL: WHERE<input
                        type={"text"}
                        value={lodash.get(this.state.playlist, dynamicSql, "")}
                        onChange={(e) => this.handleInputChange(dynamicSql, e.target.value)}
                    />
                </span>}
                </span>
            <br/>
            <input type="submit" value={lodash.startCase(this.state.action)}/>
            <br/>
            <br/>
        </form>
        {this.props.existingPlaylist && <button onClick={this.deleteEntry}>Delete</button>}
        </>
    }
}

export default CreatePlaylistComponent;
