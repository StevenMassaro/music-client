import React, {Component} from 'react';
import './App.css';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import {isNumber} from "lodash";

type props = {
    existingId: number | null,
    setActiveSongList: (songs?: Object) => void,
    activeSongList: object[],
    buildServerUrl: (relativePath: string) => string,
}

class UploadSongsComponent extends Component<props> {

    _getUrl = () => {
        let base = "/track/upload";
        const {existingId} = this.props;
        if (existingId && isNumber(existingId)) {
            base += "?existingId=" + existingId;
        }
        return base;
    };

    render() {
        const {existingId} = this.props;

        return <Dropzone
            onChangeStatus={({ meta, file, xhr, remove }, status) => {
                if(status === 'done' && xhr){
                    let songs = Object.assign([], this.props.activeSongList);
                    songs.push(JSON.parse(xhr.response));
                    this.props.setActiveSongList(songs);
                    remove();
                }
            }}
            getUploadParams={() => ({ url: this.props.buildServerUrl(this._getUrl()) })}
            accept="audio/*"
            inputContent={existingId ? `Drag (or click to browse) an audio file to replace the selected track: ${existingId}` : "Drag (or click to browse) audio files to upload"}
            maxFiles={existingId ? 1 : 250}
        />
    }
}

export default UploadSongsComponent;
