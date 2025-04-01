const {MongoClient, ObjectId} = require("mongodb");

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

module.exports = {};