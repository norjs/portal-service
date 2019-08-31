
/**
 *
 */
class RouteHandlerOptions {

    /**
     *
     * @param method {string}
     * @param path {string}
     */
    constructor ({method, path}) {

        /**
         *
         * @member {string}
         * @protected
         */
        this._method = method;

        /**
         *
         * @member {string}
         * @protected
         */
        this._path = path;

        /**
         *
         * @member {string}
         * @protected
         */
        this._socketPath = undefined;

        /**
         *
         * @member {number}
         * @protected
         */
        this._port = undefined;

        /**
         *
         * @member {string}
         * @protected
         */
        this._host = undefined;

        /**
         *
         * @member {boolean}
         * @private
         */
        this._ptth = false;

    }

    /**
     *
     * @returns {string}
     */
    get method () {
        return this._method;
    }

    /**
     *
     * @returns {string}
     */
    get path () {
        return this._path;
    }

    /**
     *
     * @returns {string}
     */
    get socketPath () {
        return this._socketPath;
    }

    /**
     *
     * @returns {number}
     */
    get port () {
        return this._port;
    }

    /**
     *
     * @returns {string}
     */
    get host () {
        return this._host;
    }

    /**
     *
     * @param value {string}
     */
    setSocketPath (value) {
        this._socketPath = value;
    }

    /**
     *
     * @param value {number}
     */
    setPort (value) {
        this._port = value;
    }

    /**
     *
     * @param value {string}
     */
    setHost (value) {
        this._host = value;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     *
     * @returns {boolean}
     */
    isPtth () {
        return this._ptth;
    }

    /**
     *
     * @returns {boolean}
     */
    setPtth (value) {
        return this._ptth = !!value;
    }

    /**
     *
     * @returns {string}
     */
    toString () {
        return RouteHandlerOptions.getLabel(this);
    }

    /**
     *
     * @param options {RouteHandlerOptions}
     * @returns {string}
     */
    static getLabel (options) {
        return options.socketPath ? `socket://${options.socketPath}` : `http://${options.host}:${options.port}`;
    }

    /**
     * Return NodeJS http request compatible options object.
     *
     * @param options {RouteHandlerOptions}
     * @returns {{path: string, socketPath: string, method: string, port: number, host: string}}
     */
    static getHttpOptions (options) {
        return {
            method: options.method,
            path: options.path,
            socketPath: options.socketPath,
            port: options.port,
            host: options.host
        };
    }

}

// Exports
module.exports = RouteHandlerOptions;
