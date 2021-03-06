import React, {Component} from 'react';
import './App.css';
import {generateUrl} from "./Utils";
import './AlbumArtComponent.css';
import Modal from "react-modal";

type props = {
    settings: object[],
    id: number, // current song ID
    buildServerUrl: (relativePath: string) => string
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
                         className={"albumArt modal"}
                         onClick={() => this.setState({modalContent: undefined})}
      />
    })
  };

  render() {
    return (<span>
      <Modal isOpen={this.state.modalContent !== undefined}
             contentLabel="Album art">
        {this.state.modalContent}
      </Modal>
      <img src={generateUrl(this.props.settings, "/track/" + this.props.id + "/art", this.props.buildServerUrl)}
           alt={"No album artwork"}
           className={"albumArt"}
           onClick={this.showModal}
      />
    </span>);
  }
}

export default AlbumArtComponent;