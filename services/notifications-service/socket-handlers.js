module.exports = (io) => {
    io.on("connection", (gatewaySocket) => {
        console.log("Socket connected", gatewaySocket.id);

        const userId = gatewaySocket.handshake.auth.userId;

        if (!userId) {
            console.warn(`Connection refused: No userId provided.`);
            return gatewaySocket.disconnect(true);
        }

        // Connect the socket to a room using the user ID passed in the auth part to make it accessible by userId.
        gatewaySocket.join(gatewaySocket.handshake.auth.userId);
    });
};