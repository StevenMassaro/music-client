import React, {Component} from 'react';
import './App.css';
import {getZuulRoute} from "./Utils";
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';
import PropTypes from 'prop-types';

class UploadSongsComponent extends Component {

    render() {
        return <Dropzone
            onChangeStatus={({ meta, file, xhr, remove }, status) => {
                if(status === 'done'){
                    let songs = Object.assign([], this.props.songs);
                    songs.push(JSON.parse(xhr.response));
                    this.props.modifySongs(songs);
                    remove();
                }
            }}
            getUploadParams={() => ({ url: getZuulRoute("/track/upload") })}
            accept="audio/*"
            inputContent="Drag (or click to browse) audio files to upload"
        />
    }
}

UploadSongsComponent.propTypes = {
    songs: PropTypes.array.isRequired,
    modifySongs: PropTypes.func.isRequired
};

export default UploadSongsComponent;
