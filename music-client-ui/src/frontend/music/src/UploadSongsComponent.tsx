import React, {Component} from 'react';
import './App.css';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import {isEmpty, isNumber} from "lodash";
import {Dropdown} from "semantic-ui-react";
import {DropdownProps} from "semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown";
import {Library} from "./types/Library";
import {api} from "./App";
import {AxiosResponse} from "axios";
import {Track} from "./types/Track";
import {toast} from "react-toastify";

type props = {
    existingId: number | undefined,
    setActiveSongList: (songs: Track[]) => void,
    activeSongList: object[],
    buildServerUrl: (relativePath: string) => string,
}

type state = {
    libraries: Library[],
    selectedLibraryId: number,
    isLibraryDropdownDisabled: boolean
}

class UploadSongsComponent extends Component<props, state> {

    constructor(props: props | Readonly<props>) {
        super(props);
        this.state = {
            libraries: [],
            selectedLibraryId: -1,
            isLibraryDropdownDisabled: false
        }
    }

    componentDidMount() {
        this.listLibraries();
    }

    listLibraries = () => {
        api.get(this.props.buildServerUrl('/library'))
            .then((response: AxiosResponse<Library[]>) => {
                this.setState({
                    libraries: response.data
                });
            });
    };

    _getUrl = () => {
        // this call (when not replacing a track) causes an error due to missing library parameter
        let base = "/track/upload";
        const {existingId} = this.props;
        if (existingId && isNumber(existingId)) {
            base += "?existingId=" + existingId;
        } else {
            base += "?libraryId=" + this.state.selectedLibraryId;
        }
        return base;
    };

    _onLibraryDropdownChange = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
        if (isNumber(data.value)) {
            this.setState({
                selectedLibraryId: data.value
            });
        }
    }

    render() {
        const {existingId} = this.props;

        let options = [
            {
                text: "Choose a library to associated newly uploaded songs with",
                value: -1
            }
        ].concat(this.state.libraries.map(library => {
            return {
                text: library.name,
                value: library.id
            }
        }));

        return <span>
            {!this.props.existingId && !isEmpty(this.state.libraries) &&
            <Dropdown
                options={options}
                onChange={this._onLibraryDropdownChange}
                value={this.state.selectedLibraryId}
                placeholder="Select a library to associate these songs with"
                disabled={this.state.isLibraryDropdownDisabled}
            />}
            <Dropzone
                disabled={!this.props.existingId && this.state.selectedLibraryId === -1}
                onChangeStatus={({meta, file, xhr, remove}, status) => {
                    if (status === 'done') {
                        this.setState({
                            isLibraryDropdownDisabled: false
                        })
                        if (xhr) {
                            let songs = Object.assign([], this.props.activeSongList);
                            songs.push(JSON.parse(xhr.response));
                            this.props.setActiveSongList(songs);
                        }
                        remove();
                    } else if (status === 'preparing') {
                        this.setState({
                            isLibraryDropdownDisabled: true
                        })
                    } else if (status === 'error_upload') {
                        let statusCode = xhr?.status;
                        let message = statusCode === 409 ? meta.name + " already exists." : "Failed to upload song.";
                        toast.error(message, {
                            autoClose: false
                        })
                    }
                }}
                getUploadParams={() => ({url: this.props.buildServerUrl(this._getUrl())})}
                accept="audio/*"
                inputContent={existingId ? `Drag (or click to browse) an audio file to replace the selected track: ${existingId}` : "Drag (or click to browse) audio files to upload"}
                maxFiles={existingId ? 1 : 1000}
            />
        </span>
    }
}

export default UploadSongsComponent;
