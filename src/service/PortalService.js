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
 * @type {typeof RouteHandlerOptions}
 */
const RouteHandlerOptions = require('../handlers/RouteHandlerOptions.js');

/**
 *
 * @type {typeof HttpRouteHandler}
 */
const HttpRouteHandler = require('../handlers/http/HttpRouteHandler.js');

/**
 *
 * @type {typeof PtthRouteHandler}
 */
const PtthRouteHandler = require('../handlers/ptth/PtthRouteHandler.js');

/**
 *
 * @type {typeof NorPortalRouteType}
 */
const NorPortalRouteType = require("../types/NorPortalRouteType");

/**
 * @implements {NorPortalAuthenticator}
 */
class DefaultAuthenticator {

    /**
     *
     * @param [config] {*} Does not need any config
     */
    constructor (config = undefined) {}

    // noinspection JSUnusedGlobalSymbols
    /**
     * Will accept any context.
     *
     * @param context {*}
     * @returns {boolean}
     */
    hasAccess (context) {
        return true;
    }

}

/**
 *
 * @enum {number}
 * @readonly
 */
const PortalServiceState = {

    UNINITIALIZED: 0,
    INITIALIZED: 1,
    DESTROYED: 2

};

/**
 * This is the primary logic for our HTTP proxy micro service.
 */
class PortalService {

    /**
     * Returns states
     *
     * @returns {typeof PortalServiceState}
     */
    static get STATE () {
        return PortalServiceState;
    }

    /**
     * Returns a string name for a state value.
     *
     * @param state {PortalServiceState}
     * @returns {string}
     */
    static getStateName (state) {
        switch (state) {
            case PortalServiceState.UNINITIALIZED: return 'UNINITIALIZED';
            case PortalServiceState.INITIALIZED: return 'INITIALIZED';
            case PortalServiceState.DESTROYED: return 'DESTROYED';
            default: return 'UNKNOWN'
        }
    }

    /**
     *
     * @param url {string}
     * @param method {string}
     * @param routeConfig {NorPortalRouteObject}
     * @returns {RouteHandlerOptions}
     */
    static parseRouteHandlerOptions ({
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

        let options = new RouteHandlerOptions({
            method,
            path
        });

        switch (routeConfig.type) {

            case NorPortalRouteType.PTTH:
                options.setPtth(true);
                break;

            case NorPortalRouteType.SOCKET:
                options.setSocketPath(routeConfig.socket);
                break;

            case NorPortalRouteType.HTTP: {

                /**
                 * @type {string}
                 */
                const targetHost = routeConfig.targetHost;

                /**
                 * @type {number}
                 */
                const targetPort = routeConfig.targetPort;

                if ( targetHost && targetPort ) {
                    options.setHost(targetHost);
                    options.setPort(targetPort);
                } else if ( targetPort ) {
                    options.setHost("localhost");
                    options.setPort(targetPort);
                }

            }
                break;

            default:

                throw new TypeError(`Unsupported route type: "${routeConfig.type}"`);

        }

        return options;

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
     * Creates a portal service instance.
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
         * @member {PortalServiceState}
         * @protected
         */
        this._state = PortalService.STATE.UNINITIALIZED;

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

        /**
         *
         * @member {NorPortalAuthenticator}
         */
        this.DEFAULT_AUTHENTICATOR = new DefaultAuthenticator();

    }

    /**
     *
     * @param state {PortalServiceState}
     * @protected
     */
    _setState (state) {

        if (this._state >= state) {
            throw new TypeError(`State was already above "${ PortalService.getStateName(state) }": it was "${ PortalService.getStateName(this._state) }"`)
        }

    }

    /**
     * Returns true if the current state is `state`.
     *
     * @param state {PortalServiceState}
     * @returns {boolean}
     * @protected
     */
    _isState (state) {
        return this._state === state;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @returns {boolean}
     */
    isInitialized () {
        return this._isState(PortalService.STATE.INITIALIZED);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @returns {boolean}
     */
    isDestroyed () {
        return this._isState(PortalService.STATE.DESTROYED);
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Close the server and free any resources.
     */
    destroy () {

        this._setState(PortalService.STATE.DESTROYED);

        this._routes = undefined;
        this._http = undefined;
        this._authenticators = undefined;
        this.DEFAULT_AUTHENTICATOR = undefined;

        console.log(LogUtils.getLine(`${PortalService.getAppName()} destroyed`));

    }

    /**
     * Called after all the parts of the service are initialized.
     *
     */
    onInit () {

        this._setState(PortalService.STATE.INITIALIZED);

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
     * This method is called from portal-service.js when the Portal's HTTP Server gets a request.
     *
     * @param request {HttpRequestObject}
     * @param response {HttpResponseObject}
     * @return {Promise|undefined}
     */
    onRequest (request, response) {

        /**
         *
         * @type {NorPortalContextObject}
         */
        const requestContext = this._createRequestContext(request);

        console.log(LogUtils.getLine(`Request "${ requestContext }" started`));

        /**
         *
         * @type {NorPortalRouteObject}
         */
        const routeConfig = this._findRouteConfig(requestContext.url);

        if (!routeConfig) {
            console.log(`WOOT: No route configuration found for "${requestContext}"`);
            throw new HttpUtils.HttpError(404, `Not Found: "${requestContext.url}"`);
        }

        console.log(`WOOT: Authenticating...`);

        return this._authenticate(requestContext, routeConfig).then(() => {

            console.log(`WOOT: Authenticated successfully`);

            /**
             *
             * @type {RouteHandlerOptions}
             */
            const options = PortalService.parseRouteHandlerOptions({
                method: requestContext.method,
                url: requestContext.url,
                routeConfig
            });

            const routeHandler = this._getRouteHandler(options, routeConfig);

            return routeHandler.run(options, request, response);

        });

    }

    onUpgrade (request, socket, head) {

        /**
         *
         * @type {NorPortalContextObject}
         */
        const requestContext = this._createRequestContext(request);

        console.log(LogUtils.getLine(`Upgrade Request "${ requestContext }" started`));

        /**
         *
         * @type {NorPortalRouteObject}
         */
        const routeConfig = this._findRouteConfig(requestContext.url);

        if (!routeConfig) {
            console.log(`WOOT: No route configuration found for "${requestContext}"`);
            throw new HttpUtils.HttpError(404, `Not Found: "${requestContext.url}"`);
        }

        console.log(`WOOT: Authenticating...`);

        return this._authenticate(requestContext, routeConfig).then(() => {

            console.log(`WOOT: Authenticated successfully`);

            const options = PortalService.parseRouteHandlerOptions({
                method: requestContext.method,
                url: requestContext.url,
                routeConfig
            });

            const routeHandler = this._getRouteHandler(options, routeConfig);

            return routeHandler.onUpgrade(request, socket, head);
        });


    }

    /**
     *
     * @param requestContext {NorPortalContextObject}
     * @param routeConfig {NorPortalRouteObject}
     * @returns {Promise}
     * @protected
     */
    _authenticate (requestContext, routeConfig) {

        /**
         * @type {NorPortalAuthenticator}
         */
        const authenticator = this._getAuthenticator(routeConfig.auth);

        if (!authenticator) {
            throw new TypeError(`No authenticator defined for "${ requestContext.url }".`);
        }

        return PromiseUtils.when(authenticator.hasAccess(requestContext)).then(
            /**
             *
             * @param result {boolean}
             */
            result => {

                if (result !== true) {
                    throw new HttpUtils.HttpError(403, `Access denied to "${ requestContext.url }"`);
                }

            }
        );

    }

    /**
     *
     * @param request {HttpRequestObject}
     * @returns {NorPortalContextObject}
     * @protected
     */
    _createRequestContext (request) {

        /**
         * @type {string}
         */
        const url = request.url;

        // noinspection JSUnresolvedVariable
        /**
         * @type {string}
         */
        const method = request.method;

        /**
         *
         * @type {string|undefined}
         * @fixme implement support
         */
        let username = undefined;

        /**
         *
         * @type {string|undefined}
         * @fixme implement support
         */
        let password = undefined;

        return {
            username,
            password,
            method,
            url,

            toString () {
                return `${this.method} ${this.url}`;
            }

        };

    }

    /**
     *
     * @param url {string}
     * @returns {NorPortalRouteObject|undefined}
     * @protected
     */
    _findRouteConfig (url) {

        url = _.replace(`${url}/`, /\/+$/, "/");

        /**
         *
         * @type {string|undefined}
         */
        const routePath = _.find(
            _.keys(this._routes),
            routePath => _.startsWith( url, `${ _.trimEnd(routePath, '/') }/`)
        );

        if (!routePath) {
            return undefined;
        }

        /**
         *
         * @type {NorPortalRouteObject}
         */
        return this._routes[routePath];

    }

    /**
     *
     * @param authName {string}
     * @return {NorPortalAuthenticator}
     * @protected
     */
    _getAuthenticator (authName) {

        if (authName) {

            if (!_.has(this._authenticators, authName)) {
                throw new Error(`No authenticator configured for "${authName}"`);
            }

            return this._authenticators[authName].authenticator;

        }

        return this.DEFAULT_AUTHENTICATOR;

    }

    /**
     *
     * @param options {RouteHandlerOptions}
     * @param routeConfig {NorPortalRouteObject}
     * @returns {RouteHandler}
     * @protected
     */
    _getRouteHandler (options, routeConfig) {

        if (routeConfig.routeHandler) {
            return routeConfig.routeHandler;
        }

        if (options.isPtth()) {

            return routeConfig.routeHandler = new PtthRouteHandler({
                http: this._http
            });

        }

        return routeConfig.routeHandler = new HttpRouteHandler({
            http: this._http
        });

    }

}

/**
 *
 * @type {typeof PortalService}
 */
module.exports = PortalService;
