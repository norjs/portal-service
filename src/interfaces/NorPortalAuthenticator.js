// Types and interfaces
require('../types/NorPortalContextObject.js');

/**
 *
 * @type {typeof TypeUtils}
 */
const TypeUtils = require("@norjs/utils/Type");

/**
 * Defines common interface to authenticate requests
 *
 * @interface
 */
class NorPortalAuthenticator {

    /**
     *
     * @param config {Object}
     */
    constructor (config) {}

    /**
     *
     * @param context {NorPortalContextObject}
     * @returns {Promise.<boolean>|boolean}
     */
    hasAccess (context) {
        return false;
    }

}

TypeUtils.defineType(
    "NorPortalAuthenticator",
    TypeUtils.classToObjectPropertyTypes(NorPortalAuthenticator),
    {
        acceptUndefinedProperties: true
    }
);

/**
 *
 * @type {typeof NorPortalAuthenticator}
 */
module.exports = NorPortalAuthenticator;
