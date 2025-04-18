// List of allowed origins that can access your server.
const ALLOWED_ORIGINS = [
    'capacitor://localhost', // Capacitor (mobile)
    'https://localhost',     // Local development (browser)
    process.env.WEBSITE_URL  // Production
];

/**
 * CORS middleware helper.
 * Use with caution: allowed methods and headers should be adapted to each API route's requirements.
 *
 * @param {IncomingMessage} request - The incoming HTTP request.
 * @param {ServerResponse} response - The HTTP response to be sent.
 */
function openedCors(request, response) {
    const origin = request.headers.origin;

    // If the origin is in the list of allowed origins, set the appropriate CORS headers.
    if (ALLOWED_ORIGINS.includes(origin)) {
        // Allow the specific origin to access server resources.
        response.setHeader('Access-Control-Allow-Origin', origin);

        // Allow credentials (cookies, authorization headers, etc.) to be included in requests.
        response.setHeader('Access-Control-Allow-Credentials', "true");
    }

    // Specify which HTTP methods are allowed.
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Specify which headers are allowed in requests.
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
}

exports.addCors = openedCors;