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
     * @param authenticators {Object.<string, NorPortalAuthObject>}
     * @param routes {Object.<string, NorPortalRouteObject>}
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
            routePath => _.startsWith( url, `${routePath}/`)
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
        console.log('REQUEST-URL: ', origUrl);

        /**
         * @type {string}
         */
        const routePath = routeConfig.path;
        console.log('ROUTE-PATH: ', routeConfig.path);

        /**
         * @type {string}
         */
        const socketPath = routeConfig.socket;

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

        return new Promise((resolve, reject) => {
            LogicUtils.tryCatch( () => {

                console.log(`Calling request "${method} ${path}" from "${socketPath}"...`);

                /**
                 *
                 * @type {HttpClientRequestObject}
                 */
                const clientReq = this._http.request({
                    method,
                    path,
                    socketPath
                }, (clientRes) => {
                    LogicUtils.tryCatch( () => {

                        console.log('Got response. Parsing.');

                        const statusCode = clientRes.statusCode;
                        const isSuccess = statusCode >= 200 && statusCode < 400;
                        res.statusCode = statusCode;

                        clientRes.on('data', (chunk) => {
                            LogicUtils.tryCatch( () => res.write(chunk, 'utf8'), reject);
                        });

                        clientRes.on('end', () => {
                            LogicUtils.tryCatch( () => {
                                console.log(`Response ended.`);
                                res.end();
                                if (isSuccess) {
                                    resolve();
                                } else {
                                    reject(`Status was "${statusCode}"`);
                                }
                            }, reject);
                        });

                    }, reject);
                });

                clientReq.on('error', reject);

                req.on('data', (chunk) => {
                    LogicUtils.tryCatch( () => clientReq.write(chunk, 'utf8'), reject);
                });

                req.on('end', () => {
                    LogicUtils.tryCatch( () => {
                        clientReq.end();
                    }, reject);
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
