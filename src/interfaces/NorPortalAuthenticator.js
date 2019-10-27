import '../types/NorPortalContextObject.js';
import TypeUtils from "@norjs/utils/Type";

/**
 * Defines common interface to authenticate requests
 *
 * @interface
 */
export class NorPortalAuthenticator {

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

// noinspection JSUnusedGlobalSymbols
export default NorPortalAuthenticator;
