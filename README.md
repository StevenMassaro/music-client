# Music Client
Music client is an unoriginally named React app that integrates with [my music API](https://github.com/StevenMassaro/music). It supports two different methods of installation: purely remote, where files are streamed from the music API, or `local` where a copy of the music files are stored on the machine hosting the music client.

![Image of UI landing page](./img/landing_page.png)

## Features (non conclusive list)
- Integration with [Media Session APIs](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession), which Chrome (first image) integrates with Windows (second image):

![Image of UI landing page](./img/chrome_media_session.png)
![Image of UI landing page](./img/media_session.png)

## Running
### Local mode
Deploying the music-client in local mode means that the client keeps a copy of all the tracks locally, and streams them locally, rather than streaming them from the server.

Note that the below command has a few placeholders that need to be replaced. It is also using a docker volume to persist local copies of the tracks.

Also note that the `local.music.file.location` MUST end with a trailing slash.

```
docker run --name="music-client" -e "zuul.routes.music-api.url"="SERVER_URL" -e "zuul.music-api.authorizationHeader"="AUTHORIZATION_HEADER" -e "music.file.source"="local" -e "device.name"="DEVICE_NAME" -e "server.port"="8080" -p "8080:8080/tcp" -v music:/music -e "local.music.file.location"="/music/" --name music --rm stevenmassaro/music-client
```

## Other useful tools
- https://github.com/evilpro/Taskplay - puts playback controls on the Windows taskbar
- https://github.com/randyrants/sharpkeys - allows remapping of keyboard keys (used to remap something useless, like scroll lock, to the "skip track" key) 

## Architecture
In previous versions, the unique design of allowing both remote and local usage of the client demanded a complicated architecture, involving an API Gateway (provided via Spring Cloud Gateway).

Current versions of the app circumvent the need for any gateway (which was a performance detriment), by making calls to the backend using CORS.