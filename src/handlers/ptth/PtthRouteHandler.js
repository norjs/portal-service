import LogUtils from "@norjs/utils/src/LogUtils";
import RouteHandler from "../RouteHandler.js";
import RouteHandlerOptions from "../RouteHandlerOptions";
import HttpUtils from "@norjs/utils/src/HttpUtils";
import PtthUtils from "@norjs/utils/src/PtthUtils";

/**
 * Route handler which routes requests to previously established reverse HTTP connection.
 */
export class PtthRouteHandler extends RouteHandler {

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
     */
    destroy () {

        this._http = undefined;
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

        console.log(LogUtils.getLine(`Requesting through a socket with options = `), options);

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
     * @returns {boolean} If `true`, upgrade finished correctly.
     */
    onUpgrade (request, socket, head) {

        if (this._socket) {

            PtthUtils.onSocketAlreadyCreatedError(request, socket, head);

            return false;
        }

        if (PtthUtils.onServerUpgrade(request, socket, head)) {

            this._socket = socket;

            this._socket.on('end', () => {

                console.log(LogUtils.getLine(`"${request.method} ${request.url}": Remote server connection ended`));

                if (socket === this._socket) {
                    this._socket = undefined;
                }

            });

            this._socket.on('close', () => {

                console.log(LogUtils.getLine(`"${request.method} ${request.url}": Remote server disconnected`));

                if (socket === this._socket) {
                    this._socket = undefined;
                }

            });

            console.log(LogUtils.getLine(`"${request.method} ${request.url}": Remote server connected through HTTP upgrade`));

            return true;
        }

        return false;

    }

}

// Exports
export default PtthRouteHandler;
