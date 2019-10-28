#!/usr/bin/env -S node -r esm

import _ from 'lodash';
import TypeUtils from "@norjs/utils/Type";
import PromiseUtils from '@norjs/utils/Promise';
import LogicUtils from '@norjs/utils/Logic';
import HttpUtils from '@norjs/utils/Http';
import PtthUtils from '@norjs/utils/Ptth';
import LogUtils from '@norjs/utils/Log';
import StringUtils from '@norjs/utils/String';
import ProcessUtils from '@norjs/utils/Process';
import PortalServiceCommand from './PortalServiceCommand.js';
import PortalService from '../service/PortalService.js';
import NorPortalRouteType from "../types/NorPortalRouteType";
import FS from 'fs';
import HTTP from 'http';

// Types and interfaces
import '@norjs/types/NorConfigurationObject.js';
import '@norjs/types/interfaces/HttpClient.js';
import '../interfaces/NorPortalAuthenticator.js';
import '../types/NorPortalContextObject.js';
import '../types/NorPortalRouteObject.js';

const nrLog = LogUtils.getLogger("portal-service");

LogicUtils.tryCatch( () => {

    // noinspection JSUnresolvedVariable
    /**
     *
     * @type {string}
     */
    const NOR_PORTAL_CONFIG = process.env.NOR_PORTAL_CONFIG || ( FS.existsSync('./nor.js') ? './nor.js' : undefined ) || './nor.json';

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
             * @type {NorPortalRouteObject}
             */
            let routeOptions = {
                path: key,
                auth: routeConfig.auth,
                targetPath: "/"
            };

            if (routeConfig.socket && routeConfig.target) {
                throw new TypeError(`You may not have both 'route.socket' and 'route.target' properties specified!`);
            }

            if (_.has(routeConfig, "ptth")) {

                if (_.isArray(routeConfig.ptth)) {
                    routeOptions.ptth = routeConfig.ptth;
                } else if (_.isString(routeConfig.ptth)) {
                    routeOptions.ptth = [routeConfig.ptth];
                } else {
                    throw new TypeError(`Illegal value for "ptth" property in a route: ${routeConfig.ptth}`);
                }

            }

            if (routeConfig.type === "ptth") {

                routeOptions.type = NorPortalRouteType.PTTH;

            } else if (routeConfig.socket) {

                routeOptions.type = NorPortalRouteType.SOCKET;
                routeOptions.socket = routeConfig.socket;

            } else if ( HttpUtils.isSocket(routeConfig.target) ) {

                routeOptions.type = NorPortalRouteType.SOCKET;
                routeOptions.socket = HttpUtils.getSocket(routeConfig.target);

            } else if ( HttpUtils.isPort(routeConfig.target) ) {

                routeOptions.type = NorPortalRouteType.HTTP;
                routeOptions.targetHost = "localhost";
                routeOptions.targetPort = HttpUtils.getPort(routeConfig.target);

            } else if ( HttpUtils.isHostPort(routeConfig.target) ) {

                routeOptions.type = NorPortalRouteType.HTTP;
                routeOptions.targetHost = HttpUtils.getHost(routeConfig.target);
                routeOptions.targetPort = HttpUtils.getPort(routeConfig.target);

            } else {

                throw new TypeError(`No proxy target detected for "${key}"`);

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

    server.on('error', err => {

        nrLog.error(`ERROR: "${err}"`);

    });

    _.each(routes,
        /**
        *
        * @param routeConfig {NorPortalRouteObject}
        */
        routeConfig => {
            PortalServiceCommand.setupRoute(HTTP, routeConfig, service);
        }
    );

    server.on('upgrade', (request, socket, head) => {

        const handleError = err => PtthUtils.handleError(request, socket, head, err);

        LogicUtils.tryCatch( () => {

            const result = service.onUpgrade(request, socket, head);

            if (PromiseUtils.isPromise(result)) {

                result.catch(handleError);

            }

        }, handleError);

    } );

    // Start listening
    HttpUtils.listen(server, NODE_LISTEN, () => {
        LogicUtils.tryCatch( () => service.onListen(HttpUtils.getLabel(NODE_LISTEN)), err => ProcessUtils.handleError(err) );
    });

    // Setup automatic destroy on when process ends
    ProcessUtils.setupDestroy(() => {

        // Shutdown sub servers
        _.each(routes,
            /**
             *
             * @param routeConfig {NorPortalRouteObject}
             */
            routeConfig => {

                if (!routeConfig) return;

                if (routeConfig.server) {
                    LogicUtils.tryCatch( () => routeConfig.server.close(), err => ProcessUtils.handleError(err) );
                    routeConfig.server = undefined;
                }

                if (routeConfig.routeHandler) {
                    LogicUtils.tryCatch( () => routeConfig.routeHandler.destroy(), err => ProcessUtils.handleError(err) );
                    routeConfig.routeHandler = undefined;
                }

            }
        );

        LogicUtils.tryCatch( () => server.close(), err => ProcessUtils.handleError(err) );

        LogicUtils.tryCatch( () => service.destroy(), err => ProcessUtils.handleError(err) );

    });

    service.onInit();

}, err => ProcessUtils.handleError(err) );
