/**
 * Custom Error class to handle HTTP errors with a specific status code.
 *
 * @class
 * @extends {Error}
 * @param {number} status - The HTTP status code.
 * @param {string} message - The error message.
 */
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

/**
 * Extracts the user ID from the request headers.
 *
 * @param {IncomingMessage} request - The HTTP request object.
 * @returns {string} The user ID extracted from the "x-user-id" header.
 * @throws {HttpError} Throws an error if the "x-user-id" header is missing.
 */
function getIDInRequest(request) {
    const userId = request.headers["x-user-id"];
    if (userId) {
        return userId;
    } else {
        throw new HttpError(400, "Missing 'x-user-id' header in the request");
    }
}

module.exports = {HttpError, getIDInRequest};