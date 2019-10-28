import TypeUtils from "@norjs/utils/Type";

/**
 * @typedef {Object} NorPortalContextObject
 * @property {string} [username] - Username if provided
 * @property {string} [password] - Password if provided
 * @property {string} method - Request method
 * @property {string} url - Request URL
 * @property {Object.<string,string>} [headers] - Request headers
 */
TypeUtils.defineType("NorPortalContextObject", {
    "username": "string",
    "password": "string",
    "method": "string",
    "url": "string",
    "headers": "Object.<string,string>"
});
