import LogUtils from "@norjs/utils/src/LogUtils";
import LogicUtils from "@norjs/utils/src/LogicUtils";
import RouteHandlerOptions from './RouteHandlerOptions.js';
import HttpUtils from "@norjs/utils/src/HttpUtils";

/**
 * @abstract
 */
export class RouteHandler {

    /**
     *
     */
    constructor () {}

    /**
     *
     */
    destroy () {}

    /**
     *
     * @param options {RouteHandlerOptions}
     * @param request {HttpRequestObject}
     * @param response {HttpResponseObject}
     * @returns {Promise}
     * @fixme Maybe rename as onRequest ? See https://github.com/norjs/portal-service/issues/15
     */
    run (options, request, response) {

        console.log(LogUtils.getLine(`Calling request "${options.method} ${options.path}" from "${options}"...`));

        return this._run(options, request, response);

    }

    /**
     *
     * @param request
     * @param socket
     * @param head
     * @returns {boolean} If `true`, upgrade finished correctly
     * @fixme Check for better error message. See https://github.com/norjs/portal-service/issues/16
     */
    onUpgrade (request, socket, head) {

        throw new TypeError(`Upgrade Not Supported`);

    }

    // noinspection JSMethodCanBeStatic
    /**
     *
     * @param options {RouteHandlerOptions}
     * @param callback {Function}
     * @returns {HttpClientRequestObject}
     * @protected
     * @abstract
     */
    _startRequest (options, callback) {
        throw new Error(`Abstract method not implemented`);
    }

    /**
     *
     * @param clientRes {HttpClientResponseObject}
     * @param response {HttpResponseObject}
     * @returns {Promise}
     * @protected
     */
    _handleResponse (clientRes, response) {

        //console.log(LogUtils.getLine('Got response. Parsing.'));

        /**
         * @type {number}
         */
        const statusCode = clientRes.statusCode;

        /**
         *
         * @type {boolean}
         */
        const isSuccess = statusCode >= 200 && statusCode < 400;

        response.statusCode = statusCode;

        return HttpUtils.proxyDataTo(clientRes, response).then(() => {

            response.end();

            //console.log(LogUtils.getLine(`Response ended.`));

            if (!isSuccess) {
                throw new HttpUtils.HttpError(statusCode);
            }

        });

    }

    /**
     *
     * @param options {RouteHandlerOptions}
     * @param request {HttpRequestObject}
     * @param response {HttpResponseObject}
     * @returns {Promise}
     * @protected
     */
    _run (options, request, response) {

        return new Promise((resolve, reject) => {
            LogicUtils.tryCatch( () => {

                /**
                 *
                 * @type {HttpClientRequestObject}
                 */
                const clientReq = this._startRequest(options, (clientRes) => {
                    LogicUtils.tryCatch( () => {
                        resolve(this._handleResponse(clientRes, response));
                    }, reject);
                });

                clientReq.on('error', reject);

                HttpUtils.proxyDataTo(request, clientReq).then(() => {
                    clientReq.end();
                }).catch( err => {
                    reject(err);
                });

            }, reject);
        });

    }

}

// Exports
export default RouteHandler;
