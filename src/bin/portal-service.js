
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
     * @type {NorPortalConfigurationObject}
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
    const routes = {};
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

            routes[key] = {
                path: key,
                socket: routeConfig.socket,
                auth: routeConfig.auth,
                client
            };

        });
    }

    /**
     * Authenticators by their name
     *
     * @type {Object.<string, NorPortalAuthObject>}
     */
    const authenticators = {};
    if (config.auth && _.keys(config.auth).length) {
        _.forEach(_.keys(config.auth), key => {

            /**
             *
             * @type {NorConfigurationAuthObject}
             */
            const authConfig = config.auth[key];

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

            const AuthenticatorClass = ProcessUtils.requireFile(authConfig.path);

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
        authenticators,
        routes,
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
