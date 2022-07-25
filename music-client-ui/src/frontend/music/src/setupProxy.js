const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(createProxyMiddleware("/Music/gs-guide-websocket", { target: "http://localhost:8090", ws: true }));
};