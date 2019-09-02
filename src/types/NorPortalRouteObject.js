
const TypeUtils = require("@norjs/utils/Type");

require('./NorPortalRouteType.js');

/**
 * @typedef {Object} NorPortalRouteObject
 * @property {string} [path] - The route path (eg. same as key)
 * @property {string} [service] - The service name
 * @property {string} [portal] - The remote portal name, where to route the request to.
 * @property {string} [socket] - The socket file name, where to route the request to.
 * @property {string} [targetHost] - The target hostname, where to route the request to, if socket is undefined.
 * @property {number} [targetPort] - The target port, where to route the request to, if socket is undefined.
 * @property {string} [targetPath] - The target path, where to route the request to, defaults to "/".
 * @property {string} [auth] - Which authentication configuration to use
 * @property {NorPortalRouteType} [type] - The type of the route
 * @property {Array.<string>} [ptth] - Array of targets to connect using reverse HTTP
 * @property {RouteHandler} [routeHandler] - Route handler instance
 * @property {Object} [server] - Server instance for this route only
 */

TypeUtils.defineType("NorPortalRouteObject", {
    "path": "string|undefined",
    "service": "string|undefined",
    "portal": "string|undefined",
    "socket": "string|undefined",
    "targetHost": "string|undefined",
    "targetPort": "number|undefined",
    "targetPath": "string|undefined",
    "auth": "string|undefined",
    "type": "NorPortalRouteType|undefined",
    "server": "Object|undefined",
    "ptth": "Array.<string>|undefined",

    // FIXME: Fix routeHandler TypeUtils definition, see https://github.com/norjs/portal-service/issues/18
    "routeHandler": "Object|undefined"

});

