const {HttpError} = require("../utils/controller-utils");
const {readData} = require("../utils/api-utils");
const {addNotification, deleteNotificationsWithUser} = require("./database");
const {DATABASE_ERRORS} = require("./utils");
const eventBus = require("./event-bus");

/**
 * Serves the API documentation by reading the data from a specified file.
 * The documentation is returned as a JSON response.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the API documentation.
 * @return {Promise<void>} - Sends a JSON response containing the API documentation.
 * @throws {HttpError} - Throws an error response if there is an issue reading the documentation file.
 */
exports.documentation = async (req, res) => {
    try {
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        res.end(readData(process.env.NOTIFICATIONS_API));
    } catch (error) {
        res.writeHead(500, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            error: "Failed to read API documentation",
            details: error.message
        }));
    }
};

/**
 * Health check endpoint.
 *
 * This function responds with a `204 No Content` status to indicate that the server is running
 * and reachable. It does not return any content in the response.
 *
 * @async
 * @function health
 * @param {IncomingMessage} req - The HTTP request object.
 * @param {ServerResponse} res - The HTTP response object.
 */
exports.health = async (req, res) => {
    res.writeHead(204);
    res.end();
};

/**
 * Handles the creation of a new notification.
 *
 * This function processes the incoming request, saves the notification data,
 * emits a "new-notification" event, and sends a response to the client.
 *
 * @async
 * @function
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @event new-notification
 * @event error - Emitted if an error occurs during notification creation.
 */
exports.addNotification = async (req, res) => {
    try {
        const notificationData = req.body;
        const notification = await addNotification(notificationData);
        eventBus.emit("new-notification", {notification});

        res.writeHead(201, {"Content-Type": "application/json"});
        res.end(JSON.stringify({message: "Notification Successfully created"}));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        if (error.message === DATABASE_ERRORS.VALIDATION_FAILED)
            throw new HttpError(400, "Invalid notification data format");

        throw new HttpError(500, error.message);
    }
};

/**
 * Handles the deletion of notifications when a user deletes their account, including notifications where they appear in the userId or friendId fields. *
 *
 * @async
 * @function
 * @param {Object} req - The request object containing the `userId` in the body.
 * @param {Object} res - The response object used to send a success message to the user-service.
 * @throws {Error} Throws an error if the deletion or event emission fails.
 * @event delete-notification-user - Emits the event with the notifications to be deleted.
 */
exports.deleteUser = async (req, res) => {
    try {
        const notifications = await deleteNotificationsWithUser(req.body.userId);
        eventBus.emit("delete-notification-user", {notifications});

        res.writeHead(201, {"Content-Type": "application/json"});
        res.end(JSON.stringify({message: "Notification Successfully created"}));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        throw new HttpError(500, error.message);
    }
};