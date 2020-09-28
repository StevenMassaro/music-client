import React, {Component} from 'react';
import './App.css';
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import PropTypes from 'prop-types';
import {isNumber} from "lodash";

class UploadSongsComponent extends Component {

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
                if(status === 'done'){
                    let songs = Object.assign([], this.props.songs);
                    songs.push(JSON.parse(xhr.response));
                    this.props.modifySongs(songs);
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

UploadSongsComponent.propTypes = {
    songs: PropTypes.array.isRequired,
    modifySongs: PropTypes.func.isRequired,
    existingId: PropTypes.number
};

export default UploadSongsComponent;
