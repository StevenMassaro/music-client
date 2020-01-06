const proxy = require("http-proxy-middleware");

module.exports = app => {
    app.use(proxy("/gs-guide-websocket", {target: "http://localhost:8090", ws: true}))
};