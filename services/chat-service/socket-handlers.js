const {saveMessage} = require("./database");

module.exports = (io) => {
    io.on('connection', (gatewaySocket) => {
        console.log("Socket connected", gatewaySocket.id);

        gatewaySocket.on("joinConversation", (conversationId) => {
            gatewaySocket.join(conversationId);
        });

        gatewaySocket.on("message", async (content, conversationId, sender) => {
            try {
                if (!content || !conversationId || !sender) {
                    return gatewaySocket.emit("error", {message: "Missing required fields"});
                }

                const message = {
                    conversationId,
                    sender,
                    content,
                    timestamp: new Date(),
                    isRead: false
                };

                await saveMessage(message);

                io.to(conversationId).emit("message", message.content);
            } catch (error) {
                console.error("Error saving message:", error);
                gatewaySocket.emit("error", {message: "Failed to send message"});
            }
        });
    });
};