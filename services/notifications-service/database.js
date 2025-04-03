const {MongoClient, ObjectId} = require("mongodb");
const {DATABASE_ERRORS} = require("./utils");

const notificationsCollection = process.env.NOTIFICATIONS_COLLECTION;
const userCollection = process.env.USER_COLLECTION;

const dbName = process.env.DB_NAME;
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(dbName);

/**
 * Handles MongoDB-specific errors and throws a more descriptive error if applicable.
 *
 * @param {Error & {code?: number}} error - The error object thrown by MongoDB,
 *                                          which may contain an error code.
 * @throws {Error} Throws a specific error message if the error is recognized,
 *                otherwise rethrows the original error.
 */
function handleMongoError(error) {
    switch (error.code) {
        default:
            throw error;
    }
}

/**
 * Executes a MongoDB operation and handles errors gracefully.
 *
 * @async
 * @param {Function} operation - A function that returns a Promise, representing
 *                               the MongoDB operation to execute.
 * @returns {Promise<*>} The result of the operation if successful.
 * @throws {Error} Throws an error if the operation fails and is not handled.
 */
async function mongoOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        handleMongoError(error);
    }
}

/**
 * Retrieves a notification by the filter criteria.
 *
 * @async
 * @function
 * @param {Object} filter - The filter criteria to find the notification.
 * @returns {Promise<Object|null>} The found notification or null if not found.
 */
async function getNotificationById(filter) {
    const notifications = await mongoOperation(() =>
        db.collection(notificationsCollection).aggregate([
            {$match: filter},
            {
                $lookup: {
                    from: userCollection,
                    localField: "friendId",
                    foreignField: "_id",
                    as: "friendInfo"
                }
            },
            {
                $addFields: {
                    friendName: {$arrayElemAt: ["$friendInfo.name", 0]}
                }
            },
            {$project: {friendInfo: 0}}
        ]).toArray());
    return notifications[0];
}

/**
 * Retrieves an array of notifications filtered by the provided criteria.
 *
 * @async
 * @function
 * @param {Object} filter - The filter criteria to find the notifications.
 * @returns {Promise<Object[]>} An array of found notifications (empty if none are found).
 */
async function getNotifications(filter) {
    const notifications = await mongoOperation(() =>
        db.collection(notificationsCollection).aggregate([
            {$match: filter},
            {
                $lookup: {
                    from: userCollection,
                    localField: "friendId",
                    foreignField: "_id",
                    as: "friendInfo"
                }
            },
            {
                $addFields: {
                    friendName: {$arrayElemAt: ["$friendInfo.name", 0]}
                }
            },
            {$project: {friendInfo: 0}}
        ]).toArray()
    );
    return notifications.map(notification => ({
        ...notification,
        _id: notification._id.toHexString()
    }));
}

/**
 * Adds a new notification to the database.
 *
 * @async
 * @function
 * @param {Object} notification - The notification object to add.
 * @returns {Promise<Object>} The newly created notification.
 * @throws {Error} Throws an error if the notification is not found after insertion.
 */
async function addNotification(notification) {
    notification.isRead = false;
    notification.friendId = new ObjectId(notification.friendId);
    const result = await mongoOperation(() => db.collection(notificationsCollection).insertOne(notification));

    const newNotification = await mongoOperation(() => getNotificationById({_id: result.insertedId}));
    if (!newNotification)
        throw Error(DATABASE_ERRORS.NOTIFICATION_NOT_FOUND);
    newNotification._id = newNotification._id.toHexString();
    return newNotification;
}

/**
 * Deletes a notification if the user is the notification recipient.
 *
 * @async
 * @throws {Error} `NOTIFICATION_NOT_FOUND_NOT_FOUND` - If the notification does not exist in the database.
 * @returns {Promise<string>} - Resolves when the notification is successfully deleted and gives the notification _id.
 * @param notificationId - The id of the notification to delete
 * @param userId - the id of the user who ask the deletion of the notification
 */
async function deleteNotification(notificationId, userId) {
    return await mongoOperation(async () => {
        const notification = await db.collection(notificationsCollection).findOneAndDelete({
            _id: new ObjectId(notificationId),
            userId: userId
        });

        if (!notification)
            throw new Error(DATABASE_ERRORS.NOTIFICATION_NOT_FOUND);

        return notification._id.toString();
    });
}

/**
 * Marks specific notification as read in the database.
 *
 * @async
 * @param {string} userId - The ID of the user making the request.
 *                          Ensures the user cannot mark a notification for which they are the recipient.
 * @returns {Promise<void>} Resolves when the update is complete.
 * @throws {Error} Throws an error if the database operation fails.
 */
async function markNotificationAsRead(userId) {
    await db.collection(notificationsCollection).updateMany(
        {
            userId: userId,
            isRead: false
        },
        {$set: {isRead: true}}
    );
}

module.exports = {
    addNotification,
    getNotifications,
    deleteNotification,
    markNotificationAsRead
};