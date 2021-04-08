import React, {Component, createRef} from 'react';
import './App.css';
import AlbumArtComponent from "./AlbumArtComponent";
import {toast} from "react-toastify";
import {Track} from "./types/Track";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import H5AudioPlayer from "react-h5-audio-player";
import StarRatingComponent from 'react-star-rating-component';

type props = {
    currentSong: () => Track,
    currentSongSrc: () => string,
    onSongEnd: (skipped: boolean) => void,
    setAudioElement: (element: HTMLAudioElement | null) => void,
    markListenedIfExceedsThreshold: () => void,
    buildServerUrl: (relativePath: string) => string,
    settings: object[],
    setRating: (id: number, rating: number) => void,
}

type state = {}

class PlayerComponent extends Component<props, state> {
    audioRef: React.RefObject<H5AudioPlayer>;

    constructor(props: Readonly<props> | props) {
        super(props);
        this.audioRef = createRef();
    }

    // this is intentionally NOT an arrow function, an arrow function does not have access to the correct "this"
    onPlaying() {
        this.props.setAudioElement(this.audioRef.current!.audio.current);
    }

    render() {
        return (<div style={{"width":"100%"}}>
            {this.props.currentSongSrc() &&
                <span>
                    <AudioPlayer
                        header={<span>
                            <AlbumArtComponent id={this.props.currentSong().id}
                                               settings={this.props.settings}
                                               buildServerUrl={this.props.buildServerUrl}
                            /> {this.props.currentSong().title} - {this.props.currentSong().artist}
                            <span style={{'float': 'right'}}>
                                <StarRatingComponent
                                    name={"songrating"}
                                    value={this.props.currentSong().rating ?? 0}
                                    starCount={10}
                                    onStarClick={((nextValue) => this.props.setRating(this.props.currentSong().id, nextValue))}
                                />
                            </span>
                        </span>}
                        src={this.props.currentSongSrc()}
                        autoPlay
                        onEnded={() => this.props.onSongEnd(false)}
                        onClickNext={() => this.props.onSongEnd(true)}
                        showSkipControls={true}
                        ref={this.audioRef}
                        onPlaying={this.onPlaying.bind(this)}
                        onListen={this.props.markListenedIfExceedsThreshold}
                        listenInterval={1000}
                        preload={"auto"}
                        onError={() => {
                            toast.error(`Failed to play ${this.props.currentSong().title} - ${this.props.currentSong().artist}`, {
                                autoClose: false
                            });
                            return this.props.onSongEnd(false);
                        }}
                        style={{
                            "backgroundColor": "rgba(255, 255, 255, 0.25)",
                            "boxShadow": "unset"
                        }}
                    />
                </span>}
        </div>
        )
    }
}

export default PlayerComponent;