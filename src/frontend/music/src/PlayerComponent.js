import React, {Component} from 'react';
import './App.css';
import ReactAudioPlayer from 'react-audio-player';

class PlayerComponent extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (<div style={{"width":"100%"}}>
            {this.props.currentSongSrc() &&
                <span>
                    <ReactAudioPlayer
                        controls
                        src={this.props.currentSongSrc()}
                        autoplay
                        onEnded={() => this.props.onSongEnd(this.audioPlayer.audioEl)}
                        ref={(element) => { this.audioPlayer = element; }}
                        style={{"width":"70%"}}
                    >
                        Your browser does not support the
                        <code>audio</code> element.
                    </ReactAudioPlayer>
                    <button onClick={() => this.props.onSongEnd(this.audioPlayer.audioEl)}>
                        Next
                    </button>
                </span>}
                {this.props.songs && <button onClick={this.props.shuffle}>
                    Shuffle
                </button>}
        </div>
        )
    }
}

export default PlayerComponent;