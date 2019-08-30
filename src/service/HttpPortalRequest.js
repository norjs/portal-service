
/**
 *
 * @type {typeof LogUtils}
 */
const LogUtils = require("@norjs/utils/src/LogUtils");

/**
 *
 * @type {typeof PortalRequest}
 */
const PortalRequest = require("./PortalRequest.js");

/**
 *
 */
class HttpPortalRequest extends PortalRequest {

    /**
     *
     * @param http {HttpClientModule}
     * @param options {PortalRequestOptions}
     */
    constructor ({http, options}) {

        super({options});

        /**
         * @member {HttpClientModule}
         * @protected
         */
        this._http = http;

    }

    /**
     *
     * @param options {PortalRequestOptions}
     * @param callback {Function}
     * @returns {HttpClientRequestObject}
     * @protected
     * @abstract
     */
    _startRequest (options, callback) {
        return this._http.request(options, callback);
    }

}

// Exports
module.exports = HttpPortalRequest;