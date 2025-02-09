// The http module contains methods to handle http queries.
const http = require('http');
const httpProxy = require('http-proxy');
const {Server} = require('socket.io');
const {io: Client} = require('socket.io-client');

// We will need a proxy to send requests to the other services.
const proxy = httpProxy.createProxyServer();

/* The http module contains a createServer function, which takes one argument, which is the function that
** will be called whenever a new request arrives to the server.
 */

const server = http.createServer(function (request, response) {
    // First, let's check the URL to see if it's a REST request or a file request.
    // We will remove all cases of "../" in the url for security purposes.
    let filePath = request.url.split("/").filter(function(elem) {
        return elem !== "..";
    });
    try {
        // If the URL starts by /api, then it's a REST request (you can change that if you want).
        if (filePath[1] === "api") {
            //TODO: Add middlewares and call microservices depending on the request.

        // If it doesn't start by /api, then it's a request for a file.
        } else {
            console.log("Request for a file received, transferring to the file service")
            proxy.web(request, response, {target: "http://127.0.0.1:8001"});
        }
    } catch(error) {
        console.log(`error while processing ${request.url}: ${error}`)
        response.statusCode = 400;
        response.end(`Something in your request (${request.url}) is strange...`);
    }
// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
})

const ioServer = new Server(server, {
    cors: {
        origin: ["http://localhost:8002", "http://localhost:8001"],
        methods: ["GET", "POST"]
    }
});

const gameServiceSocket = Client('http://localhost:8002');
const gameNamespace = ioServer.of("/game");

const servicesNamespaces = {
    Game: {
        namespace: gameNamespace,
        socket: gameServiceSocket,
    }
};

Object.entries(servicesNamespaces).forEach(([serviceName, service]) => {
    const {namespace, socket} = service;

    namespace.on("connection", (clientSocket) => {
        clientSocket.onAny((eventName, ...args) => {
            socket.emit(eventName, {
                socketId: clientSocket.id,
                args
            });
        });

        clientSocket.on("disconnect", () => {
            socket.emit(`leave${serviceName}`, clientSocket.id);
        });
    });

    socket.onAny((eventName, data) => {
        if (data.room) {
            namespace.to(data.room).emit(eventName, data.eventData);
        }
    });

    socket.on("connect", () => {
        console.log(`✅ Gateway connected to ${serviceName} Service`);
    });

    socket.on("disconnect", () => {
        console.log(`❌ Gateway disconnected from ${serviceName} Service`);
    });
});

server.listen(8000, () => {
    console.log("🌐 Gateway listening on http://localhost:8000");
});