const NOTIFICATION_TYPE = Object.freeze({
    NEW_MESSAGE: "newMessage",
    FRIEND_REQUEST: "friendRequest",
    FRIEND_DELETION: "friendDeletion",
    FRIEND_ACCEPT: "friendAccept",
    FRIENDLY_GAME: "friendlyGame"
});

/**
 * Custom Error class to handle HTTP errors with a specific status code.
 *
 * @class
 * @extends {Error}
 * @param {number} status - The HTTP status code.
 * @param {string} message - The error message.
 */
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

/**
 * Extracts the user ID from the request headers.
 *
 * @param {IncomingMessage} request - The HTTP request object.
 * @returns {string} The user ID extracted from the "x-user-id" header.
 * @throws {HttpError} Throws an error if the "x-user-id" header is missing.
 */
function getIDInRequest(request) {
    const userId = request.headers["x-user-id"];
    if (userId) {
        return userId;
    } else {
        throw new HttpError(400, "Missing 'x-user-id' header in the request");
    }
}

/**
 * Sends a notification to the notifications service.
 *
 * This function makes a POST request to the notifications service to create a new notification.
 *
 * @async
 * @function
 * @param {string} userId - The ID of the user receiving the notification.
 * @param {string} type - The type of notification.
 * @param {string[]} objectsId - An array of object IDs related to the notification.
 * @event error - Emitted if an error occurs during the request.
 */
async function sendNotification(userId, type, objectsId) {
    await fetch(process.env.NOTIFICATIONS_SERVICE_URL + "/api/notifications/addNotification", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userId: userId,
            type: type,
            objectsId: objectsId
        })
    });
}

module.exports = {HttpError, getIDInRequest, NOTIFICATION_TYPE, sendNotification};