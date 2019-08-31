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

/**
 * Route handler which uses HTTP to route the request to another location (eg. address or socket file).
 */
class HttpRouteHandler extends RouteHandler {

    /**
     *
     * @param http {HttpClientModule}
     */
    constructor ({http}) {

        super();

        /**
         * @member {HttpClientModule}
         * @protected
         */
        this._http = http;

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

        return this._http.request( RouteHandlerOptions.getHttpOptions(options) , callback);

    }

    /**
     *
     * @param options {PortalRequestOptions}
     * @param request {HttpRequestObject}
     * @param response {HttpResponseObject}
     * @returns {Promise}
     */
    run (options, request, response) {

        return super.run(options, request, response);

    }

}

// Exports
module.exports = HttpRouteHandler;
