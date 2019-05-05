/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 * @typedef {Object} NorPortalContextObject
 * @property {string} [username] - Username if provided
 * @property {string} [password] - Password if provided
 * @property {string} method - Request method
 * @property {string} url - Request URL
 * @property {string} target - The service name where we would direct the request
 */
TypeUtils.defineType("NorPortalContextObject", {
    "username": "string",
    "password": "string",
    "method": "string",
    "url": "string",
    "target": "string"
});

/**
 * @typedef {Object} NorPortalConfigurationAuthObject
 * @property {string} path - Path to the authenticator file which can be require()'d
 * @property {string|Object} config - Configuration for authenticator; if a string, excepts a path to a JSON file.
 *
 */
TypeUtils.defineType("NorPortalConfigurationAuthObject", {
    "path": "string",
    "config": "string|Object"
});

/**
 * @typedef {Object} NorPortalConfigurationServiceObject
 * @property {string} path - Path to UNIX socket file hosting a local HTTP service
 * @property {string} [auth] - The authenticator name to use. If not specified, no authenticator will be used.
 *
 */
TypeUtils.defineType("NorPortalConfigurationServiceObject", {
    "path": "string",
    "auth": "string"
});

/**
 * @typedef {Object} NorPortalConfigurationObject
 * @property {Object.<string, NorPortalConfigurationAuthObject>} auth -
 * @property {Object.<string, NorPortalConfigurationServiceObject>} services -
 * @property {Object.<string, string>} routes - Each key is a path pointing to a service name
 *
 */
TypeUtils.defineType("NorPortalConfigurationObject", {
    "auth": "Object.<string, NorPortalConfigurationAuthObject>",
    "services": "Object.<string, NorPortalConfigurationServiceObject>",
    "routes": "Object.<string, string>"
});
