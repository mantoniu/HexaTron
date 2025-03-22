const eventBus = require("./event-bus");
const {searchFroFriends} = require("./database");

const userToSocket = new Map(); // userId -> socket

module.exports = (io) => {
    io.on("connection", (gatewaySocket) => {
        const {userId} = gatewaySocket.handshake.auth;
        userToSocket.set(userId, gatewaySocket);

        gatewaySocket.on("searchFriends", async (query) => {
            try {
                gatewaySocket.emit("searchFriendsResults", await searchFroFriends(query));
            } catch (error) {
                console.error("Error while getting players according to the query:", error);
                gatewaySocket.emit("error", {message: "Failed to getting players according to the query"});
            }
        });
    });

    eventBus.on("update-status-friends", (message) => {
        const socket = userToSocket.get(message.friendId);
        if (socket) {
            socket.emit("update-status-friends", message.friendFriends);
        }
    });

    eventBus.on("delete-friends", (message, deleted) => {
        const socket = userToSocket.get(message.friendId);
        if (socket) {
            socket.emit("delete-friends", message.userId, deleted);
        }
    });
};