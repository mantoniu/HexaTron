const {createServer} = require("node:http");
const {generateDocumentationAPI} = require("./api-utils");
const {HttpError} = require("./controller-utils");

/**
 * Parses the request URL and extracts the path segments.
 *
 * @param {IncomingMessage} req - The request object containing the URL.
 * @returns {Array<string>} An array of path segments from the URL.
 */
function parseRequestPath(req) {
    const baseUrl = `http://${req.headers.host}`;
    const url = new URL(req.url, baseUrl);

    return url.pathname.split("/").filter(Boolean).slice(2);
}

/**
 * Handles errors and sends appropriate responses to the client.
 *
 * @param {IncomingMessage} req - The request object.
 * @param {ServerResponse} res - The response object.
 * @param {HttpError} error - The error that occurred.
 */
function handleError(req, res, error) {
    console.error(`[${new Date().toISOString()}] [${req.method}] ${req.url} - Error:`, error);

    const statusCode = error.status || 500;
    const message = statusCode === 500 ? "Internal Server Error" : error.message;
    res.writeHead(statusCode, {"Content-Type": "application/json"});
    res.end(JSON.stringify({error: message}));
}

/**
 * Parses the body of a request into JSON.
 *
 * @param {IncomingMessage} request - The request object.
 * @returns {Promise<Object>} The parsed request body.
 */
function parseRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = "";
        request.on("data", (chunk) => (body += chunk.toString()));

        request.on("end", () => {
            if (!body.trim())
                return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (e) {
                reject(new HttpError(400, "Invalid JSON"));
            }
        });

        request.on("error", (error) => reject(error));
    });
}

/**
 * Creates and configures an HTTP server for the service.
 *
 * @param {Array} routes - The routes for the service.
 * @param {Object|null} apiOptions - The options for generating API documentation.
 * @param {string|null} documentationPath - The path for generating API documentation.
 * @returns {Server} The created HTTP server.
 */
function createServiceServer(routes, apiOptions = null, documentationPath = null) {
    // Generate API documentation when the server starts
    if (apiOptions != null && documentationPath != null) {
        try {
            generateDocumentationAPI(documentationPath, apiOptions);
        } catch (error) {
            console.error(`Error during the creation of API documentation: ${error}`);
        }
    }

    return createServer(async (req, res) => {
        try {
            const path = parseRequestPath(req);
            const route = routes.find(
                (route) =>
                    route.method === req.method &&
                    (route.path[0] === "*" || route.path.every((segment, index) => segment.startsWith(":") || segment === path[index]))
            );

            if (!route)
                throw new HttpError(404, "Route not found");

            req.body = await parseRequestBody(req);
            await route.handler(req, res);
        } catch (error) {
            handleError(req, res, error);
        }
    });
}

module.exports = {createServiceServer};
