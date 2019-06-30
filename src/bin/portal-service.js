
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
 * @type {typeof PortalService}
 */
const PortalService = require('../service/PortalService.js');

/**
 *
 * @type {typeof SocketHttpClient}
 */
const SocketHttpClient = require('@norjs/socket/src/SocketHttpClient.js');

/**
 *
 * @type {QueryStringModule}
 */
const queryStringModule = require('querystring');

// Types and interfaces
require('@norjs/socket/src/interfaces/HttpClient.js');
require('../interfaces/NorPortalAuthenticator.js');
require('../types.js');

/**
 *
 * @type {PathModule}
 */
const PATH = require('path');

LogicUtils.tryCatch( () => {

    const NOR_PORTAL_CONFIG = process.env.NOR_PORTAL_CONFIG;

    const NOR_PORTAL_PORT = parseInteger(process.env.NOR_PORTAL_PORT);

    // noinspection JSValidateTypes
    /**
     *
     * @type {NorPortalConfigurationObject}
     */
    const config = requireFile(NOR_PORTAL_CONFIG);
    TypeUtils.assert(config, "NorPortalConfigurationObject");

    /**
     *
     * @type {HttpServerModule & HttpClientModule}
     */
    const HTTP = require('http');

    /**
     * @typedef {Object} NorPortalConfigurationService
     * @property {string} name - The service name
     * @property {string} path - Path to UNIX socket file hosting a local HTTP service
     * @property {string} [auth] - The authenticator name to use. If not specified, no authenticator will be used.
     * @property {HttpClient} client - The HTTP client
     */
    TypeUtils.defineType("NorPortalConfigurationService", {
        "name": "string",
        "path": "string",
        "auth": "string|undefined",
        "client": "HttpClient"
    });

    /**
     * Services by their name
     *
     * @type {Object.<string,NorPortalConfigurationService>}
     */
    const services = {};
    if (config.services && _.keys(config.services).length) {
        _.forEach(_.keys(config.services), key => {

            /**
             *
             * @type {NorPortalConfigurationServiceObject}
             */
            const serviceConfig = config.services[key];

            /**
             *
             * @type {SocketHttpClient}
             */
            const client = new SocketHttpClient({
                socket: serviceConfig.path,
                httpModule: HTTP,
                queryStringModule
            });

            services[key] = {
                name: key,
                path: serviceConfig.path,
                auth: serviceConfig.auth,
                client
            };

        });
    }


    /**
     * @typedef {Object} NorPortalConfigurationAuth
     * @property {string} name - The auth name
     * @property {string} path - Path to the authenticator file which can be require()'d
     * @property {Object} config - Configuration for authenticator
     * @property {NorPortalAuthenticator} authenticator - The authenticator implementation
     */
    TypeUtils.defineType("NorPortalConfigurationAuth", {
        "name": "string",
        "path": "string",
        "config": "Object",
        "authenticator": "NorPortalAuthenticator"
    });

    /**
     * Authenticators by their name
     *
     * @type {Object.<string, NorPortalConfigurationAuth>}
     */
    const authenticators = {};
    if (config.auth && _.keys(config.auth).length) {
        _.forEach(_.keys(config.auth), key => {

            /**
             *
             * @type {NorPortalConfigurationAuthObject}
             */
            const authConfig = config.auth[key];

            let configObject = {};
            if (_.has(authConfig, 'config')) {
                if (_.isObject(authConfig.config)) {
                    configObject = _.cloneDeep(authConfig.config);
                } else if (_.isString(authConfig.config)) {
                    configObject = requireFile(authConfig.config);
                } else {
                    throw new TypeError(`Unknown type of config: "${authConfig.config}"`)
                }
            }

            const AuthenticatorClass = requireFile(authConfig.path);

            const authenticator = new AuthenticatorClass(configObject);
            TypeUtils.assert(authenticator, "NorPortalAuthenticator");

            authenticators[key] = {
                name: key,
                path: authConfig.path,
                config: configObject,
                authenticator
            };

        });
    }

    /**
     *
     * @type {PortalService}
     */
    const service = new PortalService({
        services,
        authenticators,
        routes: config.routes,
        httpModule: HTTP
    });

    // noinspection JSCheckFunctionSignatures
    const server = HTTP.createServer(
        (req, res) => {

            const result = LogicUtils.tryCatch(
                () => service.onRequest(req, res),
                err => {

                    if (err && err.stack) {
                        console.log('Error: ' + err.stack);
                    } else {
                        console.log('Error: ' + err);
                    }

                    if (!res.headersSent) {
                        res.setHeader('Content-Type', 'application/json');
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end('{"error": "Exception", "code": 500}');
                    } else {
                        res.end();
                    }

                }
            );

            if (result && result.catch) {
                result.catch(err => {
                    console.error('Error: ', err);
                });
            }

        }
    );

    server.listen(NOR_PORTAL_PORT, () => {
        service.onListen(NOR_PORTAL_PORT);
    });

    let destroyed = false;
    const closeServer = () => LogicUtils.tryCatch(
        () => {
            if (destroyed) return;
            destroyed = true;

            service.destroy();

            server.close();
        },
        err => {
            console.error('Exception: ' + err)
        }
    );

    process.on('exit', closeServer);
    process.on('SIGTERM', closeServer);
    process.on('SIGINT', closeServer);
    process.on('SIGUSR1', closeServer);
    process.on('SIGUSR2', closeServer);
    process.on('uncaughtException', closeServer);

}, err => PortalService.handleError(err) );

/**
 *
 * @param value {string|undefined}
 * @returns {number|undefined}
 */
function parseInteger (value) {
    if (value === undefined) return undefined;
    return parseInt(value, 10);
}

/**
 *
 * @param name {string}
 * @return {any}
 */
function requireFile (name) {
    return require(PATH.resolve(process.cwd(), name));
}
