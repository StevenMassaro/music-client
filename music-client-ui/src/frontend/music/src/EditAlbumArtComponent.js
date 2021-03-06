import React, {Component} from 'react';
import './App.css';
import './NavigatorComponent.css';
import 'semantic-ui-css/semantic.min.css';
import {Checkbox} from "semantic-ui-react";
import {toast} from "react-toastify";
import {api} from "./App";

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
                        var formData = new FormData();
                        formData.append('file', blob, "image_file");

                        api({
                            url: this.props.buildServerUrl("/track/" + this.state.song.id + "/art?updateForEntireAlbum=" + this.state.updateAll),
                            method: 'post',
                            data: formData
                        })
                            .then(() => {
                                toast.success(this.state.song.album + ": successfully updated album art.")
                            })
                            .catch(() => {
                                toast.error("Failed to update album art.");
                            })
                    }.bind(this);
                    reader.readAsDataURL(blob);
                }
            }
        }.bind(this);
    }

    toggleUpdateAll = () => this.setState({updateAll: !this.state.updateAll});

    getAlbumArtUrl = () => `https://albumartexchange.com/covers?q=${this.state.song.artist.replaceAll(' ', '+')}+${this.state.song.album.replaceAll(' ', '+')}&fltr=ALL&sort=RATING&status=&size=any&apply-filter=`

    render() {
        return <div>
            <div>Paste an image to set the artwork for '{this.state.song.title}' by '{this.state.song.artist}' on album '{this.state.song.album}'. This change will be persisted to disk immediately.
            </div>
            <div>
                <Checkbox
                    label='Update all tracks in this album'
                    onChange={this.toggleUpdateAll}
                    checked={this.state.updateAll}
                />
            </div>
            <div>
                <iframe
                    title={"Album Art Exchange search page"}
                    src={this.getAlbumArtUrl()}
                        style={{'height': '70vh'}}
                        width={'100%'}
                />
            </div>
        </div>;
    }
}

export default EditMetadataComponent;