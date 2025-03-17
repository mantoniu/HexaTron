const {} = require("./database");

const userToSocket = new Map(); // userId -> socket

module.exports = (io) => {
    io.on("connection", (gatewaySocket) => {
        const {userId} = gatewaySocket.handshake.auth;
    });
};