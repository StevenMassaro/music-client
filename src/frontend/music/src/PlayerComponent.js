import React, {Component} from 'react';
import './App.css';
import ReactAudioPlayer from 'react-audio-player';

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
                        style={{"width":"70%"}}
                        onListen={this.props.markListenedIfExceedsThreshold}
                    >
                        Your browser does not support the
                        <code>audio</code> element.
                    </ReactAudioPlayer>
                    <button onClick={this.props.onSongEnd}>
                        Next
                    </button>
                </span>}
                {this.props.songs &&
                <span>
                    {this.props.settings &&
                    <button onClick={this.props.performSync}>Sync</button>}
                </span>}
        </div>
        )
    }
}

export default PlayerComponent;