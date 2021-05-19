import SockJsClient from "react-stomp";
import {buildAlbumArtUpdateToastMessage, buildSyncUpdateToastMessage} from "./Utils";
import {toast} from "react-toastify";
import React, {Component} from 'react';

export const WEBSOCKET_ROUTES = {
    albumArtUpdates: '/topic/art/updates',
    syncUpdates: '/topic/sync/updates'
};

/**
 * This class contains all of the logic to listen to websocket messages.
 * It is purposely written in JavaScript and not TypeScript because I got tired of
 * figuring out why the TypeScript implementations were not working.
 */
export class WebsocketListener extends Component {

    handleAlbumArtUpdateMessage = (msg) => {
        this.handleAlbumArtUpdateToast(msg,
            (msg) => buildAlbumArtUpdateToastMessage(msg),
            (msg) => msg.album);
    }

    handleSyncUpdateMessage = (msg) => {
        this.handleAlbumArtUpdateToast(msg,
            (msg) => buildSyncUpdateToastMessage(msg),
            () => "sync_updates_toast")
    }

    handleAlbumArtUpdateToast = (msg, toastMessageCallback, toastIdCallback) => {
        if (msg.position === 0) {
            toast.info(toastMessageCallback(msg), {
                toastId: toastIdCallback(msg),
                autoClose: false,
                hideProgressBar: true
            });
        } else if (msg.position === msg.max) {
            toast.dismiss(toastIdCallback(msg));
        } else {
            toast.update(toastIdCallback(msg), {
                render: toastMessageCallback(msg)
            });
        }
    };

    render() {
        return (
            <span>
                <SockJsClient
                    url={this.props.buildServerUrl("/gs-guide-websocket")}
                    topics={[WEBSOCKET_ROUTES.albumArtUpdates]}
                    onMessage={this.handleAlbumArtUpdateMessage}
                />
                <SockJsClient
                    url={"./gs-guide-websocket"}
                    topics={[WEBSOCKET_ROUTES.syncUpdates]}
                    onMessage={this.handleSyncUpdateMessage}
                />
            </span>
        )
    }

}

/*
 */