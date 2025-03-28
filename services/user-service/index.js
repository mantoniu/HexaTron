const server = require("./route.js");
const {Server} = require("socket.io");
const handleSocketEvents = require("./socket-handlers");

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

handleSocketEvents(io);

server.listen(8003, () => {
    console.log(`👤 User service listening on ${process.env.USER_SERVICE_URL}`);
});