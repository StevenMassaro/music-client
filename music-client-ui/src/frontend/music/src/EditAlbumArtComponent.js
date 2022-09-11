import React, {Component} from 'react';
import './App.css';
import {Checkbox} from "semantic-ui-react";
import {toast} from "react-toastify";
import {api} from "./App";
import reactImageSize from 'react-image-size';
import prettyBytes from 'pretty-bytes';

const ufs = require("url-file-size");

class EditMetadataComponent extends Component {

    constructor(props) {
        super(props);
        let songCopy = Object.assign({}, props.song);
        this.state = {
            updateAll: true,
            song: songCopy,
            maximizedImageUrl: null,
            imageDimensions: null,
            imageSize: null
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

                        toast.info("Updating album art...");
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
                        this.props.closeModal()
                    }.bind(this);
                    reader.readAsDataURL(blob);
                }
            }
        }.bind(this);
    }

    componentDidMount() {
        this.loadITunesAlbumArt()
    }

    loadITunesAlbumArt = () => {
        // from https://github.com/bendodson/itunes-artwork-finder
        let url = 'https://itunes.apple.com/search?term=' + encodeURI(this.state.song.album) + '&country=us&entity=album'; //hardcoded country to USA
        api.get(url)
            .then((result) => {
                this.setState({
                    results: result.data.results
                });
            })
    }

    getFullResImageFileSize = (thumbnailUrl) => {
        const url = this.generateLargeImageUrl(thumbnailUrl);

        reactImageSize(url)
            .then(({ width, height }) => {
                this.setState({
                    imageDimensions: width + "x" + height
                })
            })

        ufs(url)
            .then((value => {
                this.setState({
                    imageSize: prettyBytes(value)
                })
            }))
            .catch(console.error);
    }

    maximizeImage = artworkUrl100 => {
        this.setState({
            maximizedImageUrl: this.generateLargeImageUrl(artworkUrl100)
        }, () => this.getFullResImageFileSize(artworkUrl100))
    };

    generateLargeImageUrl = thumbnailUrl => thumbnailUrl.replace("100x100bb", "9999x9999")

    applyItunesAlbumArt = () => {
        toast.info("Updating album art...");
        api({
            url: this.props.buildServerUrl("/track/" + this.state.song.id + "/art?updateForEntireAlbum=" + this.state.updateAll + "&url=" + this.state.maximizedImageUrl),
            method: 'post'
        })
            .then(() => {
                toast.success(this.state.song.album + ": successfully updated album art.")
            })
            .catch(() => {
                toast.error("Failed to update album art.");
            })
        this.props.closeModal();
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
                <a href={this.getAlbumArtUrl()} target={"_blank"} rel="noreferrer">Open Album Art Exchange in new tab</a>
            </div>
            {!this.state.maximizedImageUrl && this.state.results && <span>
                <div>
                    Results from iTunes are listed below. Clicking an image will expand it to full resolution.
                </div>
                {this.state.results.map(result =>
                    <img src={result.artworkUrl100} alt={result.artistName + " - " + result.collectionName} onClick={() => this.maximizeImage(result.artworkUrl100)}/>
                )}
            </span>}
            {
                this.state.maximizedImageUrl && <span>
                    <button onClick={this.applyItunesAlbumArt}>Apply album art</button>
                    <button onClick={() => this.setState({
                        maximizedImageUrl: null,
                        imageDimensions: null,
                        imageSize: null
                    })}>Back</button>
                    <span>{[this.state.imageDimensions, this.state.imageSize].join(" - ")}</span>
                    <img src={this.state.maximizedImageUrl} alt={"full resolution"} className={"albumArtLarge modal"}/>
                </span>
            }
        </div>;
    }
}

export default EditMetadataComponent;