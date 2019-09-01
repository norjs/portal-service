const _ = require('lodash');

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 * This class can connect to a remote HTTP server and upgrade the connection as reversed, eg. to create a server locally
 * which a remote HTTP server can access through HTTP requests.
 */
class PtthClient {

    /**
     * Construct a PTTH client
     *
     * @param http
     * @param options
     */
    constructor ({
        http,
        options = {},
        requestHandler
    }) {

        this._http = http;

        this._options = options;

        this._server = undefined;

        this._requestHandler = requestHandler;

    }

    /**
     * Connect to a remote HTTP server which supports PTTH protocol upgrade.
     *
     * @param connectOptions
     */
    connect (connectOptions = {}) {

        const options = _.merge({
            headers: {
                'Connection': 'Upgrade',
                'Upgrade': 'PTTH/1.0'
            }
        }, this._options, connectOptions);

        const request = this._http.request(options);

        request.on('upgrade', (res, socket, upgradeHead) => this._onClientUpgrade(res, socket, upgradeHead));

        request.end();

    }

    /**
     * Handles the connection upgrade event on the client side.
     *
     * This will create the HTTP server
     *
     * @param res
     * @param socket
     * @param upgradeHead
     * @protected
     */
    _onClientUpgrade (res, socket, upgradeHead) {

        console.log('Client got upgraded!');

        if (this._server) {
            throw new TypeError(`HTTP server was already created!`);
        }

        this._server = this._http.createServer((request, response) => this._onServerRequest(request, response));

        this._server.on('error', err => this._onServerError(err));

        socket.setKeepAlive(true);

        // FIXME: Figure out a public API to do the same thing
        this._server._socket = socket;
        this._server.emit('connection', this._server._socket);

    }

    /**
     * Handles the HTTP request once the server is connected.
     *
     * @param request
     * @param response
     * @protected
     */
    _onServerRequest (request, response) {

        this._requestHandler(request, response);

    }

    /**
     * Handles HTTP server errors
     *
     * @param err
     * @protected
     */
    _onServerError (err) {

        console.error(`Error: "${err}"`);

        if (err.stack) {
            console.error(err.stack);
        }

    }

}

TypeUtils.defineType("PtthClient", value => value instanceof PtthClient);

module.exports = PtthClient;
