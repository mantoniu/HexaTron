const eventBus = require("./event-bus");

const userToSocket = new Map(); // userId -> socket

module.exports = (io) => {
    io.on("connection", (gatewaySocket) => {
        const {userId} = gatewaySocket.handshake.auth;
        userToSocket.set(userId, gatewaySocket);
    });

    eventBus.on("update-status-friends", (message) => {
        const socket = userToSocket.get(message.friendId);
        if (socket) {
            socket.emit("update-status-friends", message.friendFriends);
        }
    });

    eventBus.on("delete-friends", (message) => {
        const socket = userToSocket.get(message.friendId);
        if (socket) {
            socket.emit("delete-friends", message.userId);
        }
    });
};