
const TypeUtils = require("@norjs/utils/Type");

/**
 * @typedef {Object} NorPortalRouteObject
 * @property {string} [path] - The route path (eg. same as key)
 * @property {string} [service] - The service name
 * @property {string} [socket] - The socket file name
 * @property {string|undefined} [auth] - Which authentication configuration to use
 * @property {SocketHttpClient} [client] - The client interface
 */
TypeUtils.defineType("NorPortalRouteObject", {
    "path": "string",
    "service": "string|undefined",
    "socket": "string",
    "auth": "string|undefined",
    "client": "SocketHttpClient"
});
