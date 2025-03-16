const {saveMessage, deleteMessageWithOwner} = require("./database");

module.exports = (io) => {
    io.on('connection', (gatewaySocket) => {
        console.log("Socket connected", gatewaySocket.id);

        gatewaySocket.on("joinConversation", (conversationId) => {
            gatewaySocket.join(conversationId);
        });

        gatewaySocket.on("deleteMessage", async (messageId, userId) => {
            try {
                const conversationId = await deleteMessageWithOwner(messageId, userId);
                io.to(conversationId).emit("deleteMessage", conversationId, messageId);
            } catch (error) {
                console.error("Error deleting message:", error);
                gatewaySocket.emit("error", {message: "Failed to delete the message"});
            }
        });

        gatewaySocket.on("message", async (content, conversationId, senderId) => {
            try {
                if (!content || !conversationId || !senderId) {
                    return gatewaySocket.emit("error", {message: "Missing required fields"});
                }

                const message = {
                    conversationId,
                    senderId,
                    content,
                    timestamp: new Date(),
                    isRead: false
                };

                const messageId = await saveMessage(message);
                io.to(conversationId).emit("message", {_id: messageId, ...message});
            } catch (error) {
                console.error("Error saving message:", error);
                gatewaySocket.emit("error", {message: "Failed to send message"});
            }
        });
    });
};