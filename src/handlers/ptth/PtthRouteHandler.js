const _ = require('lodash');

/**
 *
 * @type {typeof LogUtils}
 */
const LogUtils = require("@norjs/utils/src/LogUtils");

/**
 *
 * @type {typeof RouteHandler}
 */
const RouteHandler = require("../RouteHandler.js");
const RouteHandlerOptions = require("../RouteHandlerOptions");
const HttpUtils = require("@norjs/utils/src/HttpUtils");
const PtthUtils = require("@norjs/utils/src/PtthUtils");

/**
 * Route handler which routes requests to previously established reverse HTTP connection.
 */
class PtthRouteHandler extends RouteHandler {

    /**
     *
     * @param http {*}
     */
    constructor ({http}) {

        super();

        this._http = http;

        this._socket = undefined;

    }

    /**
     *
     * @param options {RouteHandlerOptions}
     * @param callback {Function}
     * @returns {HttpClientRequestObject}
     * @protected
     * @abstract
     */
    _startRequest (options, callback) {

        if (!this.isRemoteConnected()) {
            console.error(LogUtils.getLine(`Remote server not connected`));
            throw new HttpUtils.HttpError(503);
        }

        console.log(`WOOT: PtthRouteHandler._startRequest() with options = `, options);

        return PtthUtils.request(this._http, this._socket, RouteHandlerOptions.getHttpOptions(options), callback);

    }

    /**
     *
     * @param options {RouteHandlerOptions}
     * @param request {HttpRequestObject}
     * @param response {HttpResponseObject}
     * @returns {Promise}
     */
    run (options, request, response) {

        return super.run(options, request, response);

    }

    /**
     * Returns `true` if remote HTTP server is connected through PTTH connection.
     *
     * @returns {boolean}
     */
    isRemoteConnected () {
        return !!this._socket;
    }

    /**
     *
     * @param request
     * @param socket
     * @param head
     */
    onUpgrade (request, socket, head) {

        if (this._socket) {

            return PtthUtils.onSocketAlreadyCreatedError(request, socket, head);

        }

        if (PtthUtils.onServerUpgrade(request, socket, head)) {

            this._socket = socket;

            console.log(LogUtils.getLine(`Remote server connected through HTTP upgrade`));

        }

    }

}

// Exports
module.exports = PtthRouteHandler;
