
/**
 * @implements {NorPortalAuthenticator}
 */
class MyAuthenticator {
    
    constructor (config) {
        this._config = config;
    }
    
    /**
     * 
     * @param context {NorPortalContextObject}
     * @returns {boolean}
     */
    hasAccess (context) {
        return !!context && (context.password === this._config.password);
    }
    
}

module.exports = MyAuthenticator;
