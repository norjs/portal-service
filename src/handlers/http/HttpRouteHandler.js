import LogUtils from "@norjs/utils/Log";
import RouteHandler from "../RouteHandler.js";
import RouteHandlerOptions from "../RouteHandlerOptions";

const nrLog = LogUtils.getLogger("HttpRouteHandler");

/**
 * Route handler which uses HTTP to route the request to another location (eg. address or socket file).
 */
export class HttpRouteHandler extends RouteHandler {

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
     */
    destroy () {

        this._http = undefined;

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

        const httpOptions = RouteHandlerOptions.getHttpOptions(options);

        nrLog.trace(`Requesting through a HTTP with httpOptions = `, httpOptions);

        return this._http.request( RouteHandlerOptions.getHttpOptions(options) , callback);

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

}

// Exports
export default HttpRouteHandler;
