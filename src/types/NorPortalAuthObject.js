const TypeUtils = require("@norjs/utils/Type");

/**
 * @typedef {Object} NorPortalAuthObject
 * @property {string} name - The auth name
 * @property {string} path - Path to the authenticator file which can be require()'d
 * @property {Object} config - Configuration for authenticator
 * @property {NorPortalAuthenticator} authenticator - The authenticator implementation
 */
TypeUtils.defineType("NorPortalAuthObject", {
    "name": "string",
    "path": "string",
    "config": "Object",
    "authenticator": "NorPortalAuthenticator"
});
