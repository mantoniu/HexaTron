const {HttpError} = require("../utils/controller-utils");
const {readData} = require("../utils/api-utils");

/**
 * Serves the API documentation by reading the data from a specified file.
 * The documentation is returned as a JSON response.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the API documentation.
 * @return {Promise<void>} - Sends a JSON response containing the API documentation.
 * @throws {HttpError} - Throws an error response if there is an issue reading the documentation file.
 */
exports.documentation = async (req, res) => {
    try {
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        res.end(readData(process.env.NOTIFICATIONS_API));
    } catch (error) {
        res.writeHead(500, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            error: "Failed to read API documentation",
            details: error.message
        }));
    }
};

/**
 * Health check endpoint.
 *
 * This function responds with a `204 No Content` status to indicate that the server is running
 * and reachable. It does not return any content in the response.
 *
 * @async
 * @function health
 * @param {IncomingMessage} req - The HTTP request object.
 * @param {ServerResponse} res - The HTTP response object.
 */
exports.health = async (req, res) => {
    res.writeHead(204);
    res.end();
};