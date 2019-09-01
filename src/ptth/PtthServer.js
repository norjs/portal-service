/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 *
 * @type {typeof PtthUtils}
 */
const PtthUtils = require("@norjs/utils/Ptth");

/**
 * This is a HTTP server which listens for remote connection upgrade requests and upgrades the incoming connection
 * as a HTTP client which can then make requests on the remote HTTP server running at the client side.
 */
class PtthServer {

    /**
     *
     * @param http {*}
     */
    constructor ({
        http
    }) {

        this._http = http;

        /**
         *
         * @member {HttpServerObject}
         * @private
         */
        this._server = undefined;

        /**
         *
         * @member {*|undefined}
         * @private
         */
        this._socket = undefined;

    }

    /**
     *
     * @param requestHandler {Function|undefined}
     * @returns {HttpServerObject}
     */
    createServer (requestHandler = undefined) {

        if (this._server) {
            throw new TypeError(`The server was already created!`);
        }

        this._server = this._createServer(requestHandler);

        return this._server;

    }

    /**
     *
     * @returns {boolean}
     */
    isConnected () {
        return !!this._socket;
    }

    /**
     *
     * @param options
     * @param callback {Function}
     */
    request (options, callback) {

        if (!this.isConnected()) {
            throw new TypeError(`PtthServer.prototype.request(): Remote server has not been connected yet.`);
        }

        return PtthUtils.request(this._http, this._socket, options, callback);

    }

    /**
     *
     * @returns {HttpServerObject}
     * @private
     */
    _createServer (requestHandler = undefined) {

        const server = this._http.createServer( requestHandler );

        server.on('upgrade', (request, socket, head) => this._onServerUpgrade(request, socket, head) );

        return server;

    }

    /**
     *
     * @param request
     * @param socket
     * @param head
     * @private
     */
    _onServerUpgrade (request, socket, head) {

        if (this._socket) {

            return PtthUtils.onSocketAlreadyCreatedError(request, socket, head);

        }

        if (PtthUtils.onServerUpgrade(request, socket, head)) {

            this._socket = socket;

        }

    }

}

TypeUtils.defineType("PtthServer", value => value instanceof PtthServer);

module.exports = PtthServer;
