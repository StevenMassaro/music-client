# changelog

## 1.15
* convert majority of application to typescript

## 1.14.01
* support purging individual tracks

## 1.14
* support additional libraries
* begin migration to typescript

## 1.13.01-SKIP-COUNT
* remove router and make calls directly to server
* reduce memory usage when streaming files from client server
* show skip count in UI

## 1.13-SKIP-COUNT
* record each time a song is skipped

## 1.12-2020.06.09
* allow song upload to replace existing song and take over its play history

## 1.12-2020.06.02
* show iframe of album art exchange when editing album art

## 1.11-2020-02.04
* bypass router when syncing and directly call API

## 1.11-2020.01.27
* major refactor to separate the UI from the router
  * deployment now has two separately running modules
    * the UI: UI and local backend services
    * the router: publicly exposed, routes requests to local server and to remote server

## 1.11-2020.01.12
* feature: support uploading new tracks

## 1.10-2020.01.07
* feature: websocket for album art update status
* fix: sync, by refactoring to avoid using the HttpServletRequest

## 1.9-2020.01.04
* feature: update album art

## 1.7-2019.12.02
* feature: edit rating for a song
* feature: show album art in background
* fix: clicking create smart playlist opens the update modal, not the create modal

## 1.6-2019.12.02
* feature: smart playlists

## 1.5-2019.11.19
* feature: persist metadata changes for a track to disk

## 1.4-2019.11.18
* feature: edit metadata for a track

## 1.3-2019.11.15
* feature: allow deletion of purgeable tracks (tracks marked deleted in database)

## 1.2-2019.11.14
* feature: show historical plays (songs played on a particular date)

## 1.2-2019.11.12
* fix: reload song list after performing sync
* fix: missing dependencies
* fix: prevent sync from beginning if sync is already occurring

## 1.2-2019.11.08
* feature: display album art
* use shared MetadataService 

## 1.1-2019.10.30-SNAPSHOT
* fix: increase socket timeout to 10 minutes
* fix: allow sync forcing updates using UI
* fix: only show sync button if there are no songs playing or queued
* feature: display date created in song list

## 1.1-2019.10.29-SNAPSHOT
* retrieve audio file header information (like file length)
* add ability to show detailed song info
