
/**
 * Time in milliseconds to wait before trying to connect again after a failed attempt.
 *
 * @type {number}
 */
const PTTH_CONNECTION_ERROR_RECONNECT_TIME = 5000;

/**
 * Time in milliseconds to wait before reconnecting after a connection is disconnected.
 *
 * @type {number}
 */
const PTTH_CONNECTION_DISCONNECT_RECONNECT_TIME = 500;

/**
 * The default timeout for connections.
 *
 * `0` is disabled.
 *
 * @type {number}
 */
const DEFAULT_HTTP_SERVER_TIMEOUT = 0;

const _ = require('lodash');

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 *
 * @type {typeof PromiseUtils}
 */
const PromiseUtils = require('@norjs/utils/Promise');

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
 * @type {typeof PtthUtils}
 */
const PtthUtils = require('@norjs/utils/Ptth');

/**
 *
 * @type {typeof LogUtils}
 */
const LogUtils = require('@norjs/utils/Log');

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
 */
class PortalServiceCommand {

    /**
     *
     * @param http {HttpServerModule}
     * @param routeConfig {NorPortalRouteObject}
     * @param service {PortalService}
     */
    static setupRoute (http, routeConfig, service) {

        const routePath = routeConfig.path;

        // Setup a server instance for only this route
        const routeServer = routeConfig.server = PortalServiceCommand.createRouteServer(
            http,
            routePath,
            service
        );

        routeServer.timeout = DEFAULT_HTTP_SERVER_TIMEOUT;

        routeServer.on('error', err => {

            console.error(LogUtils.getLine(`ERROR: Server "${routePath}": "${err}"`));

        });

        // Connect to remote PTTH end points
        if (routeConfig.ptth && routeConfig.ptth.length >= 1) {

            _.each( routeConfig.ptth, ptth => {

                PortalServiceCommand.setupPtthEndPoint(http, ptth, routeServer);

            });

        }

    }

    /**
     *
     * @param http {HttpServerModule}
     * @param routePath {string}
     * @param service {PortalService}
     * @returns {HttpServerObject}
     */
    static createRouteServer (http, routePath, service) {

        return HttpUtils.createJsonServer(
            http,
            (request, response) => {

                console.log(LogUtils.getLine(`Server "${routePath}": Request "${request.method} ${request.url}" started`));

                const path = routePath;

                request.url = `${ path[path.length - 1] === '/' ? path.substr(0, path.length - 1) : path }${ request.url }`;

                return service.onRequest(request, response);

            }
        );

    }

    /**
     *
     * @param http {HttpServerModule}
     * @param ptth {string} The address to connect
     * @param routeServer
     */
    static setupPtthEndPoint (http, ptth, routeServer) {

        console.log(LogUtils.getLine(`${PortalService.getAppName()} connecting to "${ptth}"...`));

        const handleError = err => {

            console.error(`ERROR: Failed to connect: "${ptth}": "${err}"`);

            if (err.stack) {
                console.error(err.stack);
            }

            setTimeout( () => {

                PortalServiceCommand.setupPtthEndPoint(http, ptth, routeServer);

            }, PTTH_CONNECTION_ERROR_RECONNECT_TIME);

        };

        LogicUtils.tryCatch( () => {

            PtthUtils.connect(http, ptth, (response, socket) => {
                LogicUtils.tryCatch( () => {

                    // noinspection JSUnresolvedFunction
                    socket.setKeepAlive(true);

                    PtthUtils.connectSocketToServer(routeServer, socket);

                    console.log(LogUtils.getLine(`${PortalService.getAppName()} connected to "${ptth}"`));

                    // noinspection JSUnresolvedFunction
                    socket.on('close', () => {

                        console.log(LogUtils.getLine(`${PortalService.getAppName()} disconnected from "${ptth}"`));

                        setTimeout( () => {

                            PortalServiceCommand.setupPtthEndPoint(http, ptth, routeServer);

                        }, PTTH_CONNECTION_DISCONNECT_RECONNECT_TIME);

                    });

                }, handleError);
            }).catch(handleError);

        }, handleError);

    }

}

// Exports
module.exports = PortalServiceCommand;
