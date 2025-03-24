const {saveMessage, deleteMessageWithOwner, markMessagesAsRead, createConversation, getConversationIdIfExists} = require("./database");
const {DATABASE_ERRORS} = require("./utils");

module.exports = (io) => {
    io.on('connection', (gatewaySocket) => {
        console.log("Socket connected", gatewaySocket.id);
        gatewaySocket.join(gatewaySocket.handshake.auth.userId);

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

        gatewaySocket.on("createConversation", async (userId, friendsId) => {
            try {
                const conversationId = await getConversationIdIfExists(userId, friendsId);

                if (conversationId.length !== 0) {
                    gatewaySocket.emit("conversationExists", conversationId[0]._id, userId);
                } else {
                    let conversation = await createConversation([userId, friendsId]);
                    let conversationForFriend = structuredClone(conversation);

                    conversation.participants = conversation.participants.filter(id => id.toString() !== userId);
                    conversationForFriend.participants = conversationForFriend.participants.filter(id => id.toString() !== friendsId);

                    const socketFriend = await io.in(friendsId).fetchSockets();
                    socketFriend.forEach(socket => {
                        socket.join(conversation._id);
                        socket.emit("newConversation", conversationForFriend, userId);
                    });
                    gatewaySocket.join(conversation._id);
                    gatewaySocket.emit("newConversation", conversation, userId);
                }
            } catch (error) {
                if (error.message === DATABASE_ERRORS.PARTICIPANT_NOT_FOUND)
                    gatewaySocket.emit("error", {message: "One or more participants do not exist."});
                else if (error.message === DATABASE_ERRORS.VALIDATION_FAILED)
                    gatewaySocket.emit("error", {message: "The conversation data is invalid."});
                else
                    gatewaySocket.emit("error", {message: error.message});
            }

        });
    });
};