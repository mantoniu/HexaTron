const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json');

/**
 * Database-related error constants.
 *
 * @readonly
 * @enum {string}
 */
const DATABASE_ERRORS = Object.freeze({
    VALIDATION_FAILED: "VALIDATION_FAILED",
    NOTIFICATION_NOT_FOUND: "NOTIFICATION_NOT_FOUND"
});

/**
 * Initializes Firebase Admin SDK using a service account credential.
 */
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

/**
 * Defines the type of notifications
 *
 * @constant {Object}
 */
const NOTIFICATIONS_TYPE = Object.freeze({
    NEW_MESSAGE: "newMessage",
    FRIEND_REQUEST: "friendRequest",
    FRIEND_DELETION: "friendDeletion",
    FRIEND_ACCEPT: "friendAccept",
    GAME_INVITATION: "gameInvitation"
});

/**
 * Generates the title and body of a push notification based on its type.
 *
 * @param {Object} notification - The notification object.
 * @param {string} notification.type - The type of the notification (must match a key in NOTIFICATIONS_TYPE).
 * @param {string} notification.friendName - The name of the friend involved in the notification.
 * @returns {{title: string, body: string}} An object containing the notification's title and body.
 */
function getNotificationInfo(notification) {
    let title = "", body = "";

    switch (notification.type) {
        case NOTIFICATIONS_TYPE.FRIEND_ACCEPT:
            title = "Friend Request Accepted";
            body = `${notification.friendName} accepted your friend request`;
            break;
        case NOTIFICATIONS_TYPE.FRIEND_DELETION:
            title = "Friend Removed";
            body = `${notification.friendName} has removed you from their friend list`;
            break;
        case NOTIFICATIONS_TYPE.FRIEND_REQUEST:
            title = "New Friend Request";
            body = `${notification.friendName} wants to become your friend`;
            break;
        case NOTIFICATIONS_TYPE.NEW_MESSAGE:
            title = "New Message";
            body = `${notification.friendName} sent you a message`;
            break;
        case NOTIFICATIONS_TYPE.GAME_INVITATION:
            title = "Game Invitation";
            body = `${notification.friendName} sent you a game invitation`;
            break;
        default:
            console.warn("Unknown notification type");
    }

    return {title, body};
}

/**
 * Sends a push notification using Firebase Cloud Messaging.
 *
 * @param {Object} notification - The notification object, used to generate the message content.
 * @param {string} notificationToken - The recipient's FCM device token.
 * @returns {void}
 */
function sendPushNotification(notification, notificationToken) {
    const {title, body} = getNotificationInfo(notification);

    if (!title || !body)
        return;

    const message = {
        notification: {
            title: title,
            body: body,
        },
        token: notificationToken,
    };

    admin.messaging().send(message)
        .catch((error) => {
            console.error('Error while sending notification:', error);
        });
}

module.exports = {sendPushNotification, DATABASE_ERRORS};