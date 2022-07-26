import React, {Component} from 'react';
import {Dropdown} from 'semantic-ui-react'
import {toast} from "react-toastify";
import * as lodash from "lodash";
import {api} from "../../App";
import {Library} from "../../types/Library";
import {MenuItem} from "../../types/MenuItem";
import {Track} from "../../types/Track";
import {AxiosResponse} from "axios";

type props<T> = {
    buildServerUrl: (valuesUrl: string) => string,
    valuesUrl: string,
    title: string,
    tracksUrl?: string,
    setActiveMenuItem: (name: string, library?:Library, callback?: (() => void) | undefined) => void,
    setActiveSongList?: (songs: Track[], name: string | undefined) => void,
    activeMenuItem: MenuItem,
    valueGetter?: (value: T) => string | number,
    textGetter?: (value: T) => string,
    dropdownOnClickCallback?: (value: T) => void,
    shouldListTracksOnClick: boolean
}

type state = {
    values?: any[]
}

export class DropdownListComponent<T> extends Component<props<T>, state> {

    constructor(props: props<T> | Readonly<props<T>>){
        super(props);
        this.state = {
            values: undefined
        }
    }

    listValues = () => {
        api.get(this.props.buildServerUrl(this.props.valuesUrl))
            .then(
                (result: AxiosResponse) => {
                    this.setState({
                        values: result.data
                    });
                })
            .catch(
                () => {
                    toast.error(`Failed to list values for ${this.props.title}`);
                }
            );
    };

    /**
     * List the tracks for the selected value. For example, one might select a particular playlist, and this should
     * fetch the tracks for that playlist and set the active song list to that playlist's array of songs.
     */
    listTracks = (selectedValue: string, name: string) => {
        api.get(this.props.buildServerUrl((this.props.tracksUrl || this.props.valuesUrl) + selectedValue))
            .then(
                (result: AxiosResponse<Track[]>) => {
                    if (lodash.isFunction(this.props.setActiveSongList)) {
                        this.props.setActiveSongList(result.data, name);
                    }
                })
            .catch(
                () => {
                    toast.error(`Failed to load songs for ${selectedValue}`);
                }
            );
    };

    _isActive = (item: string) => this.props.activeMenuItem.name === this.props.title + item;

    render() {
        return (
            <Dropdown item scrolling text={this.props.title}
                onClick={this.listValues}
            >
                <Dropdown.Menu>
                    {this.state.values && this.state.values.map(value => {
                        let val = this.props.valueGetter ? this.props.valueGetter(value) : value;
                        let text = this.props.textGetter ? this.props.textGetter(value) : value;
                        return <Dropdown.Item text={text}
                                              onClick={() => {
                                                  this.props.setActiveMenuItem(this.props.title + val);
                                                  if (lodash.isFunction(this.props.dropdownOnClickCallback)) {
                                                      return this.props.dropdownOnClickCallback(value);
                                                  }
                                                  if (this.props.shouldListTracksOnClick) {
                                                      return this.listTracks(val, text);
                                                  }
                                              }}
                                              key={val}
                                              active={this._isActive(val)}
                        />;
                    })
                    }
                </Dropdown.Menu>
            </Dropdown>
        )
    }
}
