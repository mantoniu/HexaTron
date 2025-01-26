// The http module contains methods to handle http queries.
const http = require('http');
const httpProxy = require('http-proxy');

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
        //console.log(request.headers)
        // If the URL starts by /api, then it's a REST request (you can change that if you want).
        if (filePath[1] === "api") {
            console.log("API");
            proxy.web(request, response, { target: "http://127.0.0.1:8002" });
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

// You also need to handle the upgrade requests for WebSockets.
server.on("upgrade", (request, socket, head) => {
    // Check if the URL corresponds to a WebSocket (here, "/api/socket.io")
    if (request.url.startsWith("/api/socket.io")) {
        console.log("WebSocket connection upgrade");
        // If it matches, redirect this connection to the WebSocket server.
        proxy.ws(request, socket, head, { target: "ws://127.0.0.1:8002" });
    } else {
        socket.write("HTTP/1.1 400 Bad Request\r\n");
        socket.end();
    }
});

server.listen(8000);