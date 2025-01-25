const http = require("http");
const { Server } = require("socket.io");
const { addCors } = require("../helpers/cors");


const server = http.createServer(function (request, response) {
    console.log(`Received query for a file: ${request.url}`);
    addCors(response);
    response.end("test");
}).listen(8002);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:8001",
        methods: ["GET", "POST"],
        credentials: true
    },
    path: "/api/socket.io/"
});

io.on("connection", (socket) => {
    console.log("a user connected");
});

