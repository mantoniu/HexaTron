const {saveMessage, deleteMessageWithOwner, markMessagesAsRead, createConversation, getConversationIdIfExists} = require("./database");
const {DATABASE_ERRORS} = require("./utils");

module.exports = (io) => {
    io.on('connection', (gatewaySocket) => {
        console.log("Socket connected", gatewaySocket.id);

        // Connect the socket to a room using the user ID passed in the auth part to make it accessible by userId.
        gatewaySocket.join(gatewaySocket.handshake.auth.userId);

        /**
         * Handles marking messages as read in a conversation.
         *
         * If successful, it updates the status of the messages. If an error occurs,
         * it emits an "error" event.
         *
         * @async
         * @function
         * @param {Array<string>} messageIds - The IDs of the messages to mark as read.
         * @param {string} conversationId - The ID of the conversation where the messages belong.
         * @param {string} userId - The ID of the user who is marking the messages as read.
         * @listens messagesRead
         * @event error - Emitted if an error occurs while marking the messages as read.
         */
        gatewaySocket.on("messagesRead", async (messageIds, conversationId, userId) => {
            try {
                await markMessagesAsRead(messageIds, userId);
            } catch (error) {
                console.error("Error marking messages as read:", error);
                gatewaySocket.emit("error", {message: "Failed to mark messages as read"});
            }
        });

        /**
         * Handles the joining of one or more conversation rooms by the socket.
         *
         * The socket joins the rooms corresponding to the provided conversation IDs.
         *
         * @function
         * @param {Array<string>} conversationIds - The IDs of the conversations to join.
         * @listens joinConversations
         * @event joinConversations - Emitted when a socket joins one or more conversation rooms.
         */
        gatewaySocket.on("joinConversations", (conversationIds) => {
            gatewaySocket.join(conversationIds);
        });

        /**
         * Handles the deletion of a message in a conversation.
         *
         * If the message is successfully deleted, it emits a "deleteMessage" event
         * to all participants in the conversation. If an error occurs, it emits an "error" event.
         *
         * @async
         * @function
         * @param {string} messageId - The ID of the message to delete.
         * @param {string} userId - The ID of the user requesting the deletion.
         * @listens deleteMessage
         * @event deleteMessage - Emitted when a message is deleted in a conversation.
         * @event error - Emitted if an error occurs during message deletion.
         */
        gatewaySocket.on("deleteMessage", async (messageId, userId) => {
            try {
                const conversationId = await deleteMessageWithOwner(messageId, userId);
                io.to(conversationId).emit("deleteMessage", conversationId, messageId);
            } catch (error) {
                console.error("Error deleting message:", error);
                gatewaySocket.emit("error", {message: "Failed to delete the message"});
            }
        });

        /**
         * Handles the sending of a message in a conversation.
         *
         * If any required fields (content, conversationId, or senderId) are missing,
         * it emits an "error" event. Otherwise, it saves the message, adds a timestamp,
         * and emits a "message" event to all participants in the conversation.
         * If a callback is provided, it is called with the new message.
         *
         * @async
         * @function
         * @param {string} content - The content of the message being sent.
         * @param {string} conversationId - The ID of the conversation where the message is sent.
         * @param {string} senderId - The ID of the user sending the message.
         * @param {function} [callback] - An optional callback to handle the new message.
         * @listens message
         * @event message - Emitted when a new message is sent to the conversation.
         * @event error - Emitted if required fields are missing or message saving fails.
         */
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

        /**
         * Handles the creation of a conversation between two users.
         *
         * If a conversation between the users already exists, it emits a "conversationExists" event
         * with the existing conversation ID. Otherwise, it creates a new conversation, updates the
         * participant lists, and emits a "newConversation" event to both users.
         *
         * @async
         * @function
         * @param {string} userId - The ID of the user initiating the conversation.
         * @param {string} friendsId - The ID of the friend to start the conversation with.
         * @listens createConversation
         * @event conversationExists - Emitted if the conversation already exists.
         * @event newConversation - Emitted when a new conversation is created.
         * @event error - Emitted if an error occurs during conversation creation.
         */
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