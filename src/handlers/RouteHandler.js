import _ from 'lodash';
import LogUtils from "@norjs/utils/src/LogUtils";
import LogicUtils from "@norjs/utils/src/LogicUtils";
import RouteHandlerOptions from './RouteHandlerOptions.js';
import HttpUtils from "@norjs/utils/src/HttpUtils";

const nrLog = LogUtils.getLogger("RouteHandler");

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

        nrLog.trace(`Calling request "${options.method} ${options.path}" from "${options}"...`);

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

        /**
         * @type {number}
         */
        const statusCode = clientRes ? clientRes.statusCode : undefined;

        nrLog.trace(`Got response with status ${statusCode}. Proxying it....`);

        _.forEach(_.keys(clientRes.headers), key => {
            response.setHeader(key, clientRes.headers[key]);
        });

        response.statusCode = statusCode;

        return HttpUtils.proxyDataTo(clientRes, response).then(() => {

            response.end();

            nrLog.trace(`Response ended.`);

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
