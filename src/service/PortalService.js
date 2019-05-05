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
 */
class PortalService {

    /**
     *
     * @param services {Object.<string,NorPortalConfigurationService>}
     * @param authenticators {Object.<string, NorPortalConfigurationAuth>}
     * @param routes {Object.<string, string>}
     * @param httpModule {HttpModule}
     */
    constructor ({
        services,
        authenticators,
        routes,
        httpModule
    }) {

        this._http = httpModule;

        /**
         *
         * @member {Object.<string,NorPortalConfigurationService>}
         * @private
         */
        this._services = services;

        /**
         *
         * @member {Object.<string, NorPortalConfigurationAuth>}
         * @private
         */
        this._authenticators = authenticators;

        /**
         *
         * @member {Object.<string, string>}
         * @private
         */
        this._routes = routes;

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
     *
     * @param port {number}
     */
    onListen (port) {
        console.log(`[${PortalService.getTimeForLog()}] ${PortalService.getAppName()} running at ${port}`);
    }

    /**
     *
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @return {Promise}
     */
    onRequest (req, res) {
        console.log(`[${PortalService.getTimeForLog()}] Request "${req.method} ${req.url}" started`);

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
        const url = _.replace(`${req.url}/`, /\/+$/, "/");

        /**
         *
         * @type {string|undefined}
         */
        let routePath = _.find(
            _.keys(this._routes),
            routePath => _.startsWith( url, `${routePath}/`)
        );

        if (!routePath) {
            throw new TypeError(`No route found for "${url}"`);
        }

        if (!_.has(this._routes, routePath)) {
            throw new TypeError(`No route configured for "${routePath}"`);
        }

        /**
         *
         * @type {string}
         */
        const targetService = this._routes[routePath];

        if (!_.has(this._services, targetService)) {
            throw new Error(`No service configured for "${targetService}"`)
        }

        /**
         *
         * @type {NorPortalConfigurationService}
         */
        const serviceConfig = this._services[targetService];

        /**
         *
         * @type {string|undefined}
         */
        const authName = serviceConfig.auth;

        /**
         * @type {NorPortalConfigurationAuth|undefined}
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
            method: req.method,
            url: req.url,
            target: targetService
        };

        if (authConfig && authConfig.authenticator) {
            return PortalService._promiseWhen(authConfig.authenticator.hasAccess(requestContext)).then(
                /**
                 *
                 * @param result {boolean}
                 */
                result => {
                    if (result !== true) {
                        throw new Error(`Access denied to "${url}"`);
                    }

                    return this._proxyRequestTo(req, res, requestContext, serviceConfig, routePath);
                }
            );
        } else {
            return this._proxyRequestTo(req, res, requestContext, serviceConfig, routePath);
        }

    }

    /**
     *
     * @param req {HttpRequestObject}
     * @param res {HttpResponseObject}
     * @param requestContext {NorPortalContextObject}
     * @param serviceConfig {NorPortalConfigurationService}
     * @param routePath {string}
     * @returns {Promise}
     * @private
     */
    _proxyRequestTo (req, res, requestContext, serviceConfig, routePath) {

        console.log('REQUEST-URL: ', req.url);
        console.log('ROUTE-PATH: ', routePath);

        const method = req.method;
        let path = req.url.substr(routePath.length);
        const socketPath = serviceConfig.path;

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

    /**
     * Close the server
     */
    destroy () {
        console.log(`[${PortalService.getTimeForLog()}] ${PortalService.getAppName()} destroyed`);
    }

    /**
     *
     * @param err {*}
     */
    static handleError (err) {
        console.error('Exception: ' + err);
        if (err.stack) {
            console.error(err.stack);
        }
        process.exit(1);
    }

    /**
     *
     * @returns {string}
     */
    static getTimeForLog () {
        return (new Date()).toISOString();
    }

    /**
     *
     * @param value {Promise|*}
     * @returns {Promise}
     * @private
     */
    static _promiseWhen (value) {
        if (value && value.then) {
            return value;
        }

        return new Promise(resolve => resolve(value));
    }

}

/**
 *
 * @type {typeof PortalService}
 */
module.exports = PortalService;
