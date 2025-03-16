const {Server} = require('socket.io');
const server = require("./route.js");
const handleSocketEvents = require("./socket-handlers");

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

handleSocketEvents(io);

server.listen(8005, () => {
    console.log(`💬 Chat Service listening on ${process.env.CHAT_SERVICE_URL}`);
});
