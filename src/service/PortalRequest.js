
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
     * @param request {HttpRequestObject}
     * @param response {HttpResponseObject}
     * @param options {PortalRequestOptions}
     */
    constructor ({request, response, options}) {

        /**
         *
         * @member {HttpRequestObject}
         * @protected
         */
        this._request = request;

        /**
         *
         * @member {HttpResponseObject}
         * @protected
         */
        this._response = response;

        /**
         *
         * @member {PortalRequestOptions}
         * @protected
         */
        this._options = options;

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
     * @returns {Promise}
     * @protected
     */
    _handleResponse (clientRes) {

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

        this._response.statusCode = statusCode;

        return HttpUtils.proxyDataTo(clientRes, this._response).then(() => {

            this._response.end();

            console.log(LogUtils.getLine(`Response ended.`));

            if (!isSuccess) {
                throw new HttpUtils.HttpError(statusCode);
            }

        });

    }

    /**
     *
     * @param options {PortalRequestOptions}
     * @returns {Promise}
     * @protected
     */
    _run (options) {

        return new Promise((resolve, reject) => {
            LogicUtils.tryCatch( () => {

                /**
                 *
                 * @type {HttpClientRequestObject}
                 */
                const clientReq = this._startRequest(options, (clientRes) => {
                    LogicUtils.tryCatch( () => {
                        resolve(this._handleResponse(clientRes));
                    }, reject);
                });

                clientReq.on('error', reject);

                HttpUtils.proxyDataTo(this._request, clientReq).then(() => {
                    clientReq.end();
                }).catch( err => {
                    reject(err);
                });

            }, reject);
        });

    }

    /**
     *
     * @returns {Promise}
     */
    run () {

        console.log(LogUtils.getLine(`Calling request "${this._options.method} ${this._options.path}" from "${this._options}"...`));

        return this._run(this._options);

    }

}

// Exports
module.exports = PortalRequest;
