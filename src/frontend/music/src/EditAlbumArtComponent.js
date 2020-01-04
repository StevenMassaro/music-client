import React, {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import 'semantic-ui-css/semantic.min.css';
import {ZUUL_ROUTE} from "./App";
import {Checkbox} from "semantic-ui-react";
import {toast} from "react-toastify";

const axios = require('axios').default;

class EditMetadataComponent extends Component {

    constructor(props) {
        super(props);
        let songCopy = Object.assign({}, props.song);
        this.state = {
            updateAll: true,
            song: songCopy
        }
    }

    componentWillMount() {
        document.onpaste = function (event) {
            var items = (event.clipboardData || event.originalEvent.clipboardData).items;
            for (let index in items) {
                const item = items[index];
                if (item.kind === 'file') {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = function (event) {
                        let updatingMessage = toast.info("Updating album art.", {
                            autoClose: false,
                            hideProgressBar: true
                        });

                        var formData = new FormData();
                        formData.append('file', blob, "image_file");

                        axios({
                            url: "." + ZUUL_ROUTE + "/track/" + this.state.song.id + "/art?updateForEntireAlbum=" + this.state.updateAll,
                            method: 'post',
                            data: formData
                        })
                            .then(() => {
                                toast.dismiss(updatingMessage);
                                toast.success("Successfully updated album art.")
                            })
                            .catch((error) => {
                                toast.dismiss(updatingMessage);
                                let err = error.toJSON();
                                console.log(err);
                                toast.error(err.message);
                            })
                    }.bind(this);
                    reader.readAsDataURL(blob);
                }
            }
        }.bind(this);
    }

    toggleUpdateAll = () => this.setState({updateAll: !this.state.updateAll});

    render() {
        return <div>
            <div>Paste an image to set the artwork for this song. This change will be persisted to disk immediately.
            </div>
            <div>
                <Checkbox
                    label='Update all tracks in this album'
                    onChange={this.toggleUpdateAll}
                    checked={this.state.updateAll}
                />
            </div>
        </div>;
    }
}

export default EditMetadataComponent;