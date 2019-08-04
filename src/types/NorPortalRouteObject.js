
const TypeUtils = require("@norjs/utils/Type");

/**
 * @typedef {Object} NorPortalRouteObject
 * @property {string} [path] - The route path (eg. same as key)
 * @property {string} [service] - The service name
 * @property {string} [socket] - The socket file name, where to route the request to.
 * @property {string} [targetHost] - The target hostname, where to route the request to, if socket is undefined.
 * @property {number} [targetPort] - The target port, where to route the request to, if socket is undefined.
 * @property {string|undefined} [auth] - Which authentication configuration to use
 * @property {SocketHttpClient} [client] - The client interface
 */
TypeUtils.defineType("NorPortalRouteObject", {
    "path": "string",
    "service": "string|undefined",
    "socket": "string",
    "targetHost": "string",
    "targetPort": "number",
    "auth": "string|undefined",
    "client": "SocketHttpClient"
});
