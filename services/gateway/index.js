// The http module contains methods to handle http queries.
const http = require('http');
const httpProxy = require('http-proxy');
const {Server} = require('socket.io');
const jwt = require("jsonwebtoken");
const {io: Client} = require('socket.io-client');
const {addCors} = require("./cors");

const servicesConfig = {
    user: {
        target: process.env.USER_SERVICE_URL,

        http: {
            path: '/api/user',
            publicRoutes: ["login", "register", "resetPassword"],
            requiresAuth: true
        },
        ws: null
    },

    chat: {
        target: process.env.CHAT_SERVICE_URL,

        http: {
            path: '/api/chat',
            publicRoutes: [],
            requiresAuth: true
        },
        ws: {
            namespace: '/chat',
        }
    },

    game: {
        target: process.env.GAME_SERVICE_URL,

        http: null,
        ws: {
            namespace: '/game',
        }
    }
};

const filesService = {
    target: process.env.FILES_URL,
    http: {
        path: '/',
        requiresAuth: false
    },
    ws: null
};

// We will need a proxy to send requests to the other services.
const jwtAccessSecretKey = process.env.ACCESS_TOKEN_SECRET;
const jwtRefreshSecretKey = process.env.REFRESH_TOKEN_SECRET;
const proxy = httpProxy.createProxyServer();

/**
 * Checks the authentication of a request and returns token information
 *
 * @param {Object} req - The HTTP request
 * @param {Object} serviceConfig - The service configuration
 * @returns {Object} The decoded token information or an object with empty userId if auth is not required
 * @throws {Error} Throws an error if authentication fails
 */
function checkAuthentication(req, serviceConfig) {
    // If authentication is not required or if it's an OPTIONS request or a public route
    if (!serviceConfig.http.requiresAuth ||
        req.method === 'OPTIONS' ||
        serviceConfig.http.publicRoutes?.some(route => req.url.includes(route))) {
        return {userId: ""};
    }

    // Token verification
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new Error("No token provided");
    }

    // Verification based on token type (access or refresh)
    const isRefreshRoute = req.url.includes('refreshToken');
    const secret = isRefreshRoute ? jwtRefreshSecretKey : jwtAccessSecretKey;

    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw new Error("Invalid token");
    }
}

/* The http module contains a createServer function, which takes one argument, which is the function that
** will be called whenever a new request arrives to the server.
*/
const server = http.createServer((request, response) => {
    addCors(response);
    try {
        // Find the matching service or use the files service as default
        const matchedService = Object.values(servicesConfig).find(
            (config) => config.http && request.url.startsWith(config.http.path)
        ) || filesService;

        if (matchedService.http) {
            try {
                // Check authentication
                const decoded = checkAuthentication(request, matchedService);

                // Add user ID to headers if available
                if (decoded?.userId)
                    request.headers['x-user-id'] = decoded.userId;

                // Redirect the request to the appropriate service
                proxy.web(request, response, {target: matchedService.target});
            } catch (error) {
                // Handle authentication errors
                if (error.message === "No token provided")
                    response.statusCode = 401;
                else response.statusCode = 498;

                response.end(JSON.stringify({error: error.message}));
            }
        } else {
            response.statusCode = 404;
            response.end('Service not found');
        }
    } catch (error) {
        console.error(`Error processing ${request.url}:`, error);
        response.statusCode = 400;
        response.end('Something is strange in your request');
    }
});

const ioServer = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

Object.values(servicesConfig).forEach(service => {
    if (!service.ws)
        return;

    const nameSpace = ioServer.of(service.ws.namespace);
    nameSpace.on("connection", (clientSocket) => {
        const socket = Client(service.target);

        clientSocket.onAny((eventName, ...args) => socket.emit(eventName, ...args));
        clientSocket.on("disconnect", () => socket.disconnect());

        socket.onAny((eventName, ...args) => clientSocket.emit(eventName, ...args));
    });
});

server.listen(8000, () => {
    console.log(`🌐 Gateway listening on ${process.env.GATEWAY_URL}`);
});