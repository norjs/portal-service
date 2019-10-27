import _ from 'lodash';
import LogicUtils from '@norjs/utils/Logic';
import HttpUtils from '@norjs/utils/Http';
import PtthUtils from '@norjs/utils/Ptth';
import LogUtils from '@norjs/utils/Log';
import PortalService from '../service/PortalService.js';

import {
    DEFAULT_HTTP_SERVER_TIMEOUT,
    PTTH_CONNECTION_DISCONNECT_RECONNECT_TIME,
    PTTH_CONNECTION_ERROR_RECONNECT_TIME
} from "../constants";

/**
 *
 */
export class PortalServiceCommand {

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
export default PortalServiceCommand;
