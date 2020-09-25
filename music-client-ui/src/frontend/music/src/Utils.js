import {MUSIC_FILE_SOURCE_TYPES} from "./App";
import React from 'react';
import * as lodash from "lodash";

/**
 * Generate a relative url, deciding whether to call the client-server (in local mode) or to call the server.
 * @param generateServerUrlCallback A function that is called to generate the URL for a server API call.
 */
export function generateUrl(settings, url, generateServerUrlCallback) {
  if (settings) {
    if (settings.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local) {
      if(!url.startsWith(".")){
        url = "." + url;
      }
      return url;
    } else {
      return generateServerUrlCallback(url);
    }
  }
}

export function buildAlbumArtUpdateToastMessage(msg) {
    return <div>Updating album art for {msg.album}: {msg.position}/{msg.max}</div>
}

export function buildSyncUpdateToastMessage(msg) {
    return <div>{lodash.startCase(lodash.lowerCase(msg.syncStep))}: {msg.position}/{msg.max}</div>
}