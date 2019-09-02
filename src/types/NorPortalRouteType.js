
const TypeUtils = require("@norjs/utils/Type");

/**
 * @enum {string} NorPortalRouteType
 * @readonly
 */
const NorPortalRouteType = {
    SOCKET: "SOCKET",
    HTTP: "HTTP",
    PTTH: "PTTH"
};

// FIXME: Implement enum support for TypeUtils.defineType(), see https://github.com/norjs/portal-service/issues/18
TypeUtils.defineType("NorPortalRouteType", "string");

// Exports
module.exports = NorPortalRouteType;
