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
 */
class PortalService {

    /**
     *
     * @param authenticators {Object.<string,NorPortalAuthObject>}
     * @param routes {Object.<string,NorPortalRouteObject>}
     * @param httpModule {HttpModule}
     */
    constructor ({
        routes = {},
        authenticators = {},
        httpModule
    }) {

        /**
         *
         * @member {HttpModule}
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

        /**
         * @type {string}
         */
        const origUrl = req.url;
        console.log(LogUtils.getLine(`REQUEST-URL: "${origUrl}"`));

        /**
         * @type {string}
         */
        const routePath = _.trimEnd(routeConfig.path, '/');
        console.log(LogUtils.getLine(`ROUTE-PATH: "${routeConfig.path}"`));

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

        // noinspection JSUnresolvedVariable
        /**
         * @type {string}
         */
        const method = req.method;

        /**
         * @type {string}
         */
        let path = origUrl.substr(routePath.length);
        if (!path) path = '/';

        let options = {
            method,
            path
        };

        if (socketPath) {
            options.socketPath = socketPath;
        } else if ( targetHost && targetPort ) {
            options.host = targetHost;
            options.port = targetPort;
        } else if ( targetPort ) {
            options.host = "localhost";
            options.port = targetPort;
        } else {
            throw new TypeError(`No proxy target specified`);
        }

        /**
         *
         * @type {string}
         */
        const targetLabel = options.socketPath ? `socket://${options.socketPath}` : `http://${options.host}:${options.port}`;

        console.log(LogUtils.getLine(`Calling request "${method} ${path}" from "${targetLabel}"...`));

        return new Promise((resolve, reject) => {
            LogicUtils.tryCatch( () => {

                /**
                 *
                 * @type {HttpClientRequestObject}
                 */
                const clientReq = this._http.request(options, (clientRes) => {
                    LogicUtils.tryCatch( () => {

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

                        res.statusCode = statusCode;

                        resolve(HttpUtils.proxyDataTo(clientRes, res).then(() => {

                            console.log(LogUtils.getLine(`Response ended.`));

                            res.end();

                            if (!isSuccess) {
                                throw new HttpUtils.HttpError(statusCode);
                            }

                        }));

                    }, reject);
                });

                clientReq.on('error', reject);

                HttpUtils.proxyDataTo(req, clientReq).then(() => {
                    clientReq.end();
                }).catch( err => {
                    reject(err);
                });

            }, reject);
        });
    }

    // noinspection JSMethodCanBeStatic
    /**
     * Close the server
     */
    destroy () {
        console.log(LogUtils.getLine(`${PortalService.getAppName()} destroyed`));
    }

}

/**
 *
 * @type {typeof PortalService}
 */
module.exports = PortalService;
