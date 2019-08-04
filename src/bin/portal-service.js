
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
 * @type {typeof HttpUtils}
 */
const HttpUtils = require('@norjs/utils/Http');

/**
 *
 * @type {typeof StringUtils}
 */
const StringUtils = require('@norjs/utils/String');

/**
 *
 * @type {typeof ProcessUtils}
 */
const ProcessUtils = require('@norjs/utils/Process');

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
require('@norjs/types/NorConfigurationObject.js');
require('@norjs/socket/src/interfaces/HttpClient.js');
require('../interfaces/NorPortalAuthenticator.js');
require('../types/NorPortalContextObject.js');
require('../types/NorPortalRouteObject.js');

LogicUtils.tryCatch( () => {

    // noinspection JSUnresolvedVariable
    /**
     *
     * @type {string}
     */
    const NOR_PORTAL_CONFIG = process.env.NOR_PORTAL_CONFIG || './nor.json';

    // noinspection JSUnresolvedVariable
    /**
     *
     * @type {number|undefined}
     */
    const NOR_PORTAL_PORT = StringUtils.parseInteger(process.env.NOR_PORTAL_PORT);

    // noinspection JSUnresolvedVariable
    /**
     *
     * @type {string}
     */
    const NODE_LISTEN = process.env.NODE_LISTEN || (NOR_PORTAL_PORT ? `localhost:${NOR_PORTAL_PORT}` : undefined) || './socket.sock';

    // noinspection JSValidateTypes
    /**
     *
     * @type {NorConfigurationObject}
     */
    const config = ProcessUtils.requireFile(NOR_PORTAL_CONFIG);
    TypeUtils.assert(config, "NorConfigurationObject");

    /**
     *
     * @type {HttpServerModule & HttpClientModule}
     */
    const HTTP = require('http');

    /**
     * Routes by their name
     *
     * @type {Object.<string,NorPortalRouteObject>}
     */
    let routes = {};

    if (config.routes && _.keys(config.routes).length) {
        _.forEach(_.keys(config.routes), key => {

            /**
             *
             * @type {NorConfigurationRouteObject}
             */
            const routeConfig = config.routes[key];

            /**
             *
             * @type {SocketHttpClient}
             */
            const client = new SocketHttpClient({
                socket: routeConfig.socket,
                httpModule: HTTP,
                queryStringModule
            });

            const routeOptions = {
                path: key,
                auth: routeConfig.auth,
                client
            };

            if (routeConfig.socket && routeConfig.target) {
                throw new TypeError(`You may not have both 'route.socket' and 'route.target' properties specified!`);
            }

            if (routeConfig.socket) {
                routeOptions.socket = routeConfig.socket;
            } else if ( HttpUtils.isSocket(routeOptions.target) ) {
                routeOptions.socket = HttpUtils.getSocket(routeOptions.target);
            } else if ( HttpUtils.isPort(routeOptions.target) ) {
                routeOptions.targetHost = "localhost";
                routeOptions.targetPort = HttpUtils.getPort(routeOptions.target);
            } else if ( HttpUtils.isHostPort(routeOptions.target) ) {
                routeOptions.targetHost = HttpUtils.getHost(routeOptions.target);
                routeOptions.targetPort = HttpUtils.getPort(routeOptions.target);
            } else {
                throw new TypeError(`No proxy target detected.`);
            }

            routes[key] = routeOptions;

        });
    }

    /**
     * Authenticators by their name
     *
     * @type {Object.<string,NorPortalAuthObject>}
     */
    let authenticators = {};

    if (config.auth && _.keys(config.auth).length) {
        _.forEach(
            _.keys(config.auth),
            /**
             *
             * @param key {string}
             */
            key => {

                /**
                 *
                 * @type {NorConfigurationAuthObject}
                 */
                const authConfig = config.auth[key];

                /**
                 *
                 * @type {Object}
                 */
                let configObject = {};
                if (_.has(authConfig, 'config')) {
                    if (_.isObject(authConfig.config)) {
                        configObject = _.cloneDeep(authConfig.config);
                    } else if (_.isString(authConfig.config)) {
                        configObject = ProcessUtils.requireFile(authConfig.config);
                    } else {
                        throw new TypeError(`Unknown type of config: "${authConfig.config}"`)
                    }
                }

                /**
                 *
                 * @type {typeof NorPortalAuthenticator}
                 */
                const AuthenticatorClass = ProcessUtils.requireFile(authConfig.path);

                /**
                 *
                 * @type {NorPortalAuthenticator}
                 */
                const authenticator = new AuthenticatorClass(configObject);
                TypeUtils.assert(authenticator, "NorPortalAuthenticator");

                authenticators[key] = {
                    name: key,
                    path: authConfig.path,
                    config: configObject,
                    authenticator
                };

            }
        );
    }

    /**
     *
     * @type {PortalService}
     */
    const service = new PortalService({
        routes: routes,
        authenticators: authenticators,
        httpModule: HTTP
    });

    // Create server
    const server = HttpUtils.createJsonServer(
        HTTP,
        (req, res) => service.onRequest(req, res)
    );

    // Start listening
    HttpUtils.listen(server, NODE_LISTEN, () => {
        LogicUtils.tryCatch( () => service.onListen(HttpUtils.getLabel(NODE_LISTEN)), err => ProcessUtils.handleError(err) );
    });

    // Setup automatic destroy on when process ends
    ProcessUtils.setupDestroy(() => {

        LogicUtils.tryCatch( () => service.destroy(), err => ProcessUtils.handleError(err) );

        LogicUtils.tryCatch( () => server.close(), err => ProcessUtils.handleError(err) );

    });

    service.onInit();

}, err => ProcessUtils.handleError(err) );
