const eventBus = require("./event-bus");
const {searchFroFriends} = require("./database");

module.exports = (io) => {
    io.on("connection", (gatewaySocket) => {

        // Connect the socket to a room using the user ID passed in the auth part to make it accessible by userId.
        gatewaySocket.join(gatewaySocket.handshake.auth.userId);

        /**
         * Handles searching for friends based on a query.
         *
         * When a user searches for friends, it emits the search results back to the socket.
         * If an error occurs, it emits an "error" event.
         *
         * @async
         * @function
         * @param {string} query - The search query to find friends.
         * @listens searchFriends
         * @event searchFriendsResults - Emitted with the results of the friend search.
         * @event error - Emitted if an error occurs during the search process.
         */
        gatewaySocket.on("searchFriends", async (query) => {
            try {
                gatewaySocket.emit("searchFriendsResults", await searchFroFriends(query));
            } catch (error) {
                console.error("Error while getting players according to the query:", error);
                gatewaySocket.emit("error", {message: "Failed to getting players according to the query"});
            }
        });
    });

    /**
     * Handles the update of a friend's status, triggered by the user through the controller.
     *
     * When a friend's status is updated by the user, it emits an "update-status-friends" event to the friend by friend's socket,
     * notifying the friend about the updated status.
     *
     * @function
     * @param {Object} message - The message containing the user and updated status information.
     * @param {string} message.friendId - The ID of the friend whose status is being updated.
     * @param {string} message.friendFriends - The updated status of the friend.
     * @listens update-status-friends
     * @event update-status-friends - Emitted to the friend when their status is updated by another user.
     */
    eventBus.on("update-status-friends", async (message) => {
        const socketFriend = await io.in(message.friendId).fetchSockets();
        if (socketFriend) {
            socketFriend.forEach(socket => {
                socket.emit("update-status-friends", message.friendFriends);
            });
        }
    });

    /**
     * Handles the deletion of a friend from a user's friend list, triggered by the user through the controller.
     *
     * When a friend is deleted, it emits a "delete-friends" event to the corresponding socket,
     * notifying the friend about the deletion.
     *
     * @function
     * @param {Object} message - The message containing the user and friend information.
     * @param {string} message.userId - The ID of the user performing the deletion.
     * @param {string} message.friendId - The ID of the friend being deleted.
     * @param {boolean} deleted - The status of the deletion (true if deleted).
     * @listens delete-friends
     * @event delete-friends - Emitted to the friend when the deletion is confirmed by the user.
     */
    eventBus.on("delete-friends", async (message, deleted) => {
        const socketFriend = await io.in(message.friendId).fetchSockets();
        if (socketFriend) {
            socketFriend.forEach(socket => {
                socket.emit("delete-friends", message.userId, deleted);
            });
        }
        if (deleted)
            await fetch("http://chat-service:8005/api/chat/deleteUser", {
                method: "DELETE",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({userId: message.friendId})
            });
    });
};