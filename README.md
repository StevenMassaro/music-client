# Music Client
Music client is an unoriginally named React app that integrates with [my music API](https://github.com/StevenMassaro/music). It supports two different methods of installation: purely remote, where files are streamed from the music API, or `local` where a copy of the music files are stored on the machine hosting the music client.

![Image of UI landing page](./img/landing_page.png)

## Features (non conclusive list)
- Integration with [Media Session APIs](https://developer.mozilla.org/en-US/docs/Web/API/MediaSession), which Chrome (first image) integrates with Windows (second image):

![Image of UI landing page](./img/chrome_media_session.png)
![Image of UI landing page](./img/media_session.png)


## Architecture
In previous versions, the unique design of allowing both remote and local usage of the client demanded a complicated architecture, involving an API Gateway (provided via Spring Cloud Gateway).

Current versions of the app circumvent the need for any gateway (which was a performance detriment), by making calls to the backend using CORS.