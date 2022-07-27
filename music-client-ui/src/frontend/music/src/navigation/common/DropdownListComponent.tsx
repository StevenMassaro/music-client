import React, {Component} from 'react';
import {Dropdown, DropdownItemProps, Input} from 'semantic-ui-react'
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
    shouldListTracksOnClick: boolean,
    groupBy?: (track: Track) => string
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

    _getValues = () => {
        return this.state.values?.map(item => {
            let val = this.props.valueGetter ? this.props.valueGetter(item) : item;
            let text = this.props.textGetter ? this.props.textGetter(item) : item;
            let dropdownItem:DropdownItemProps = {};
            dropdownItem.text = text;
            dropdownItem.value = val;
            dropdownItem.onClick= () => {
                console.log("fart");
                this.props.setActiveMenuItem(this.props.title + val);
                if (lodash.isFunction(this.props.dropdownOnClickCallback)) {
                    return this.props.dropdownOnClickCallback(item);
                }
                if (this.props.shouldListTracksOnClick) {
                    return this.listTracks(val, text);
                }
            }
            return dropdownItem;
        }) || []
    }

    render() {
        return (
            <Dropdown
                options={this._getValues()}
                search
                fluid
                placeholder={this.props.title}
                onClick={this.listValues}
                />
        )
    }
}
