
/**
 * Time in milliseconds to wait before trying to connect again after a failed attempt.
 *
 * @type {number}
 */
export const PTTH_CONNECTION_ERROR_RECONNECT_TIME = 5000;

/**
 * Time in milliseconds to wait before reconnecting after a connection is disconnected.
 *
 * @type {number}
 */
export const PTTH_CONNECTION_DISCONNECT_RECONNECT_TIME = 500;

/**
 * The default timeout for connections.
 *
 * `0` is disabled.
 *
 * @type {number}
 */
export const DEFAULT_HTTP_SERVER_TIMEOUT = 0;
