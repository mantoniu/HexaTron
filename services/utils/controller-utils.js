const NOTIFICATION_TYPE = Object.freeze({
    NEW_MESSAGE: "newMessage",
    FRIEND_REQUEST: "friendRequest",
    FRIEND_DELETION: "friendDeletion",
    FRIEND_ACCEPT: "friendAccept",
    GAME_INVITATION: "gameInvitation"
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
 * @param {string} friendId - The id of the friend that execute an action
 * @param {string[]} objectsId - Ids of several object if necessary
 * @event error - Emitted if an error occurs during the request.
 */
async function sendNotification(userId, type, friendId, objectsId = null) {
    let body;
    if (objectsId)
        body = JSON.stringify({
            userId: userId,
            type: type,
            friendId: friendId,
            objectsId: objectsId
        });

    else
        body = JSON.stringify({
            userId: userId,
            type: type,
            friendId: friendId
        });

    await fetch(process.env.NOTIFICATIONS_SERVICE_URL + "/api/notifications/addNotification", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: body
    });
}

module.exports = {HttpError, getIDInRequest, NOTIFICATION_TYPE, sendNotification};