const {Server} = require("socket.io");
const server = require("./route.js");
const handleSocketEvents = require("./socket-handlers");

(async () => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    handleSocketEvents(io);

    server.listen(8007, () => {
        console.log(`💬 Notifications Service listening on ${process.env.NOTIFICATIONS_SERVICE_URL}`);
    });
})();