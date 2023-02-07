import React, {Component} from 'react';
import './App.css';
import {generateUrl} from "./Utils";
import './AlbumArtComponent.css';
import {Settings} from "./types/Settings";
import {Modal} from "semantic-ui-react";

type props = {
    settings: Settings,
    id: number, // current song ID
    buildServerUrl: (relativePath: string) => string,
    artSize: string // Small or Fill
}

type state = {
    modalContent: any
}

class AlbumArtComponent extends Component<props,state> {
  constructor(props: props | Readonly<props>) {
    super(props);
    this.state = {
      modalContent: undefined
    }
  }

  showModal = () => {
    this.setState({
      modalContent: <img src={generateUrl(this.props.settings, "/track/" + this.props.id + "/art", this.props.buildServerUrl)}
                         alt={"No album artwork"}
                         className={"albumArtLarge modal"}
                         onClick={() => this.setState({modalContent: undefined})}
      />
    })
  };

  render() {
    return (<span>
      <Modal open={this.state.modalContent !== undefined}>
          <Modal.Content>
            {this.state.modalContent}
          </Modal.Content>
      </Modal>
      <img src={generateUrl(this.props.settings, "/track/" + this.props.id + "/art", this.props.buildServerUrl)}
           alt={""}
           className={"albumArt" + this.props.artSize}
           onClick={this.showModal}
      />
    </span>);
  }
}

export default AlbumArtComponent;