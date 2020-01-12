import React, {Component} from 'react';
import './App.css';
import {getZuulRoute} from "./Utils";
import 'react-dropzone-uploader/dist/styles.css';
import Dropzone from 'react-dropzone-uploader';

class UploadSongsComponent extends Component {

    render() {
        return <Dropzone
            getUploadParams={() => ({ url: getZuulRoute("/track/upload") })}
            accept="audio/*"
            inputContent="Drag (or click to browse) audio files to upload"
        />
    }
}

export default UploadSongsComponent;
