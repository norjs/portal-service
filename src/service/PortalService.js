const _ = require('lodash');

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 *
 * @type {typeof LogicUtils}
 */
const LogicUtils = require('@norjs/utils/Logic');

/**
 *
 * @type {typeof LogUtils}
 */
const LogUtils = require('@norjs/utils/Log');

/**
 *
 * @type {typeof PromiseUtils}
 */
const PromiseUtils = require('@norjs/utils/Promise');

/**
 *
 * @type {typeof HttpUtils}
 */
const HttpUtils = require('@norjs/utils/Http');

/**
 *
 * @type {typeof PortalRequestOptions}
 */
const PortalRequestOptions = require('./PortalRequestOptions.js');

/**
 *
 * @type {typeof HttpPortalRequest}
 */
const HttpPortalRequest = require('./HttpPortalRequest.js');

/**
 *
 */
class PortalService {

    /**
     *
     * @param authenticators {Object.<string,NorPortalAuthObject>}
     * @param routes {Object.<string,NorPortalRouteObject>}
     * @param httpModule {HttpClientModule}
     */
    constructor ({
        routes = {},
        authenticators = {},
        httpModule
    }) {

        /**
         *
         * @member {HttpClientModule}
         * @private
         */
        this._http = httpModule;

        /**
         *
         * @member {Object.<string, NorPortalRouteObject>}
         * @private
         */
        this._routes = routes;

        /**
         *
         * @member {Object.<string, NorPortalAuthObject>}
         * @private
         */
        this._authenticators = authenticators;

        /**
         *
         * @member {typeof PortalService}
         */
        this.Class = PortalService;

    }

    /**
     *
     * @returns {string}
     * @abstract
     */
    static getAppName () {
        return '@norjs/portal-service';
    }

    /**
     * Called after all the parts of the service are initialized.
     *
     */
    onInit () {
    }

    // noinspection JSMethodCanBeStatic
    /**
     *
     * @param port {string}
     */
    onListen (port) {
        console.log(LogUtils.getLine(`${PortalService.getAppName()} running at ${port}`));
    }

    /**
     *
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @return {Promise}
     */
    onRequest (req, res) {

        /**
         * @type {string}
         */
        const origUrl = req.url;

        // noinspection JSUnresolvedVariable
        /**
         * @type {string}
         */
        const method = req.method;

        console.log(LogUtils.getLine(`Request "${method} ${origUrl}" started`));

        /**
         *
         * @type {string|undefined}
         */
        let username = undefined;

        /**
         *
         * @type {string|undefined}
         */
        let password = undefined;

        /**
         * @type {string}
         */
        const url = _.replace(`${origUrl}/`, /\/+$/, "/");

        /**
         *
         * @type {string|undefined}
         */
        let routePath = _.find(
            _.keys(this._routes),
            routePath => _.startsWith( url, `${ _.trimEnd(routePath, '/') }/`)
        );

        if (!routePath) {
            throw new HttpUtils.HttpError(404, `Not Found: "${url}"`);
        }

        /**
         *
         * @type {NorPortalRouteObject}
         */
        const routeConfig = this._routes[routePath];

        /**
         *
         * @type {string|undefined}
         */
        const authName = routeConfig.auth;

        /**
         * @type {NorPortalAuthObject|undefined}
         */
        let authConfig = undefined;

        if (authName) {

            if (!_.has(this._authenticators, authName)) {
                throw new Error(`No authenticator configured for "${authName}"`)
            }

            authConfig = this._authenticators[authName];

        }

        /**
         *
         * @type {NorPortalContextObject}
         */
        const requestContext = {
            username,
            password,
            method: method,
            url: origUrl
        };

        if (authConfig && authConfig.authenticator) {
            return PromiseUtils.when(authConfig.authenticator.hasAccess(requestContext)).then(
                /**
                 *
                 * @param result {boolean}
                 */
                result => {

                    if (result !== true) {
                        throw new HttpUtils.HttpError(403, `Access denied to "${url}"`);
                    }

                    return this._proxyRequestTo(req, res, requestContext, routeConfig);
                }
            );
        } else {
            return this._proxyRequestTo(req, res, requestContext, routeConfig);
        }

    }

    /**
     *
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @param requestContext {NorPortalContextObject}
     * @param routeConfig {NorPortalRouteObject}
     * @returns {Promise}
     * @private
     */
    _proxyRequestTo (req, res, requestContext, routeConfig) {

        const options = PortalService.parsePortalRequestOptions({
            method: req.method,
            url: req.url,
            routeConfig: routeConfig
        });

        const request = new HttpPortalRequest({
            http: this._http,
            request: req,
            response: res,
            options
        });

        return request.run();

    }

    // noinspection JSMethodCanBeStatic
    /**
     * Close the server
     */
    destroy () {
        console.log(LogUtils.getLine(`${PortalService.getAppName()} destroyed`));
    }

    /**
     *
     * @param url {string}
     * @param method {string}
     * @param routeConfig {NorPortalRouteObject}
     * @returns {PortalRequestOptions}
     */
    static parsePortalRequestOptions ({
        url,
        method,
        routeConfig
    }) {

        /**
         * @type {string}
         */
        const routePath = _.trimEnd(routeConfig.path, '/');

        /**
         * @type {string}
         */
        let path = url.substr(routePath.length);
        if (!path) path = '/';

        /**
         * @type {string}
         */
        const socketPath = routeConfig.socket;

        /**
         * @type {string}
         */
        const targetHost = routeConfig.targetHost;

        /**
         * @type {number}
         */
        const targetPort = routeConfig.targetPort;

        let options = new PortalRequestOptions({
            method,
            path
        });

        if (socketPath) {
            options.setSocketPath(socketPath);
        } else if ( targetHost && targetPort ) {
            options.setHost(targetHost);
            options.setPort(targetPort);
        } else if ( targetPort ) {
            options.setHost("localhost");
            options.setPort(targetPort);
        } else {
            throw new TypeError(`No proxy target specified`);
        }

        return options;

    }

}

/**
 *
 * @type {typeof PortalService}
 */
module.exports = PortalService;
