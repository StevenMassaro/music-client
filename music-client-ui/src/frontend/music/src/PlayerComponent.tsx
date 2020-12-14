import React, {Component} from 'react';
import './App.css';
import ReactAudioPlayer from 'react-audio-player';
import AlbumArtComponent from "./AlbumArtComponent";
import {toast} from "react-toastify";
import {Track} from "./types/Track";

type props = {
    currentSong: () => Track,
    currentSongSrc: () => string,
    onSongEnd: (skipped:boolean) => void,
    setAudioElement: (element:ReactAudioPlayer|null) => void,
    markListenedIfExceedsThreshold: () => void,
    buildServerUrl: (relativePath: string) => string,
    settings: object[],
}

class PlayerComponent extends Component<props> {
    render() {
        return (<div style={{"width":"100%"}}>
            {this.props.currentSongSrc() &&
                <span>
                    <ReactAudioPlayer
                        controls
                        src={this.props.currentSongSrc()}
                        autoPlay
                        onEnded={() => this.props.onSongEnd(false)}
                        ref={(element) => this.props.setAudioElement(element)}
                        style={{"width":"90%"}}
                        onListen={this.props.markListenedIfExceedsThreshold}
                        listenInterval={1000}
                        preload={"auto"}
                        onError={() => {
                            toast.error(`Failed to play ${this.props.currentSong().title} - ${this.props.currentSong().artist}`, {
                                autoClose: false
                            });
                            return this.props.onSongEnd(false);
                        }}
                    >
                        Your browser does not support the
                        <code>audio</code> element.
                    </ReactAudioPlayer>
                    <button onClick={() => this.props.onSongEnd(true)}>
                        Next
                    </button>
                    <AlbumArtComponent id={this.props.currentSong().id}
                                       settings={this.props.settings}
                                       buildServerUrl={this.props.buildServerUrl}
                    />
                </span>}
        </div>
        )
    }
}

export default PlayerComponent;