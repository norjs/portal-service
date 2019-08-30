/**
 * This is a sample HTTP client which connect to a remote server and upgrades the connection as a HTTP server, so then
 * the remote server turns into a HTTP client and can make requests on the client side HTTP server.
 */

/**
 *
 * @type {string | string}
 */
const HOSTNAME = process.env.HOSTNAME || '127.0.0.1';

const PORT = process.env.PORT || 8080;

const http = require('http');

const options = {
    host: HOSTNAME,
    port: PORT,
    path: '/',
    headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'PTTH/1.0'
    }
};

// Make a request
const req = http.request(options);

req.end();

req.on('upgrade', (res, socket, upgradeHead) => {

    console.log('Client got upgraded!');

    const server = http.createServer((req, res) => {

        console.log(`Request "${req.method}" "${ req.url }"`);

        res.write(JSON.stringify({time: (new Date()).getTime()}));
        res.end();

    });

    server.on('error', err => {

        console.error(`Error: "${err}"`);

        if (err.stack) {
            console.error(err.stack);
        }

    });

    socket.setKeepAlive(true);
    server._socket = socket;
    server.emit('connection', server._socket);

});

