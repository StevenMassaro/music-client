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

/**
 * Properly parse the rest response. If the response does not come back OK, throw the exception.
 * @private
 */
export function handleRestResponse(res) {
    if (res.ok) {
        return res.json();
    } else {
        throw res;
    }
}

/**
 * Get the relative path of a route which should be routed through Zuul.
 * @private
 */
export function getZuulRoute(relativePath){return "." + ZUUL_ROUTE + (relativePath.startsWith("/") ? relativePath : "/" + relativePath);}
