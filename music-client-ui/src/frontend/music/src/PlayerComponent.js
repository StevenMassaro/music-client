import React, {Component} from 'react';
import './App.css';
import ReactAudioPlayer from 'react-audio-player';
import AlbumArtComponent from "./AlbumArtComponent";

class PlayerComponent extends Component {
    render() {
        return (<div style={{"width":"100%"}}>
            {this.props.currentSongSrc() &&
                <span>
                    <ReactAudioPlayer
                        controls
                        src={this.props.currentSongSrc()}
                        autoplay
                        onEnded={this.props.onSongEnd}
                        ref={(element) => this.props.setAudioElement(element)}
                        style={{"width":"90%"}}
                        onListen={this.props.markListenedIfExceedsThreshold}
                    >
                        Your browser does not support the
                        <code>audio</code> element.
                    </ReactAudioPlayer>
                    <button onClick={() => this.props.onSongEnd(true)}>
                        Next
                    </button>
                    <AlbumArtComponent id={this.props.currentSong().id}
                                       settings={this.props.settings}/>
                </span>}
        </div>
        )
    }
}

export default PlayerComponent;