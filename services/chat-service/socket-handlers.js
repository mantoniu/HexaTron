const {saveMessage, deleteMessageWithOwner, markMessagesAsRead} = require("./database");

module.exports = (io) => {
    io.on('connection', (gatewaySocket) => {
        console.log("Socket connected", gatewaySocket.id);

        gatewaySocket.on("messagesRead", async (messageIds, conversationId, userId) => {
            try {
                await markMessagesAsRead(messageIds, userId);
            } catch (error) {
                console.error("Error marking messages as read:", error);
                gatewaySocket.emit("error", {message: "Failed to mark messages as read"});
            }
        });

        gatewaySocket.on("joinConversations", (conversationIds) => {
            gatewaySocket.join(conversationIds);
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

        gatewaySocket.on("message", async (content, conversationId, senderId, callback) => {
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
                const newMessage = {_id: messageId, ...message};

                if (callback)
                    callback(newMessage);

                gatewaySocket.to(conversationId).emit("message", conversationId, newMessage);
            } catch (error) {
                console.error("Error saving message:", error);
                gatewaySocket.emit("error", {message: "Failed to send message"});
            }
        });
    });
};