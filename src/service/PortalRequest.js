
/**
 *
 * @type {typeof LogUtils}
 */
const LogUtils = require("@norjs/utils/src/LogUtils");

/**
 *
 * @type {typeof LogicUtils}
 */
const LogicUtils = require("@norjs/utils/src/LogicUtils");

/**
 *
 * @type {typeof PortalRequestOptions}
 */
const PortalRequestOptions = require('./PortalRequestOptions.js');

/**
 *
 * @type {typeof HttpUtils}
 */
const HttpUtils = require("@norjs/utils/src/HttpUtils");

/**
 * @abstract
 */
class PortalRequest {

    /**
     *
     * @param options {PortalRequestOptions}
     */
    constructor ({options}) {

        /**
         *
         * @member {PortalRequestOptions}
         * @protected
         */
        this._options = options;

    }

    /**
     *
     * @param request {HttpRequestObject}
     * @param response {HttpResponseObject}
     * @returns {Promise}
     */
    run (request, response) {

        console.log(LogUtils.getLine(`Calling request "${this._options.method} ${this._options.path}" from "${this._options}"...`));

        return this._run(this._options, request, response);

    }

    // noinspection JSMethodCanBeStatic
    /**
     *
     * @param options {PortalRequestOptions}
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

        console.log(LogUtils.getLine('Got response. Parsing.'));

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

            console.log(LogUtils.getLine(`Response ended.`));

            if (!isSuccess) {
                throw new HttpUtils.HttpError(statusCode);
            }

        });

    }

    /**
     *
     * @param request {HttpRequestObject}
     * @param response {HttpResponseObject}
     * @param options {PortalRequestOptions}
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
module.exports = PortalRequest;
