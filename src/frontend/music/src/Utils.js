import {MUSIC_FILE_SOURCE_TYPES, ZUUL_ROUTE} from "./App";

/**
 * Generate a relative url, deciding whether to use Zuul or not.
 */
export function generateUrl(settings, url) {
  if (settings) {
    if (settings.musicFileSource === MUSIC_FILE_SOURCE_TYPES.local) {
      if(!url.startsWith(".")){
        url = "." + url;
      }
      return url;
    } else {
      return "." + ZUUL_ROUTE + url;
    }
  }
}