const eventBus = require("./event-bus");
const {getNotificationByUser, deleteNotification, markNotificationAsRead} = require("./database");

module.exports = (io) => {
    io.on("connection", async (gatewaySocket) => {
        console.log("Socket connected", gatewaySocket.id);

        const userId = gatewaySocket.handshake.auth.userId;

        if (!userId) {
            console.warn(`Connection refused: No userId provided.`);
            return gatewaySocket.disconnect(true);
        }

        // Connect the socket to a room using the user ID passed in the auth part to make it accessible by userId.
        gatewaySocket.join(gatewaySocket.handshake.auth.userId);

        gatewaySocket.emit("notifications", await getNotificationByUser({userId: gatewaySocket.handshake.auth.userId}));

        /**
         * Handles the deletion of a notification.
         *
         * @async
         * @function
         * @param {string} notificationId - The ID of the notification to delete.
         * @listens deleteNotifications
         * @event notificationDeletionSucessfull - Emitted when a notification is deleted.
         * @event error - Emitted if an error occurs during notification deletion.
         */
        gatewaySocket.on("deleteNotifications", async (notificationId) => {
            try {
                await deleteNotification(notificationId, userId);
                io.to(userId).emit("deleteNotifications", notificationId);
            } catch (error) {
                console.error("Error deleting message:", error);
                gatewaySocket.emit("error", {message: "Failed to delete the notification"});
            }
        });

        /**
         * Handles marking notifications as read.
         *
         * If successful, it updates the status of the notifications. If an error occurs,
         * it emits an "error" event.
         *
         * @async
         * @function
         * @param {Array<string>} notificationIds - The IDs of the notifications to mark as read.
         * @listens notificationsRead
         * @event error - Emitted if an error occurs while marking the notifications as read.
         */
        gatewaySocket.on("notificationsRead", async (notificationIds) => {
            try {
                await markNotificationAsRead(notificationIds, userId);
            } catch (error) {
                console.error("Error marking notifications as read:", error);
                gatewaySocket.emit("error", {message: "Failed to mark notifications as read"});
            }
        });
    });

    /**
     * Handles the addition of a notification for a user, triggered by the user-service through the controller.
     *
     * @async
     * @function
     * @event new-notification
     * @param {Object} notification - The notification object
     */
    eventBus.on("new-notification", async (notification) => {
        console.log(notification);
        const socketUser = await io.in(notification.notification.userId).fetchSockets();
        if (socketUser) {
            socketUser.forEach(socket => {
                socket.emit("new-notification", notification);
            });
        }
    });
};