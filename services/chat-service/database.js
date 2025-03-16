const {MongoClient, ObjectId} = require("mongodb");
const {DATABASE_ERRORS} = require("./utils");

const conversationCollection = process.env.CONVERSATION_COLLECTION;
const messageCollection = process.env.MESSAGE_COLLECTION;
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
        case 121:
            throw new Error(DATABASE_ERRORS.VALIDATION_FAILED);
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
 * Retrieves all conversations of a user with their latest message in a single query.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} - List of conversations with the last message.
 */
async function getUserConversationsWithLastMessage(userId) {
    return await mongoOperation(() =>
        db.collection(conversationCollection).aggregate([
            {$match: {participants: userId}},
            {
                $lookup: {
                    from: messageCollection,
                    let: {convId: "$_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ["$conversationId", "$$convId"]}}},
                        {$sort: {timestamp: -1}},
                        {$limit: 1}
                    ],
                    as: "lastMessage"
                }
            },
            {
                $addFields: {
                    lastMessage: {$arrayElemAt: ["$lastMessage", 0]}
                }
            }
        ]).toArray()
    );
}

/**
 * Retrieves a conversation with a limited number of recent messages.
 *
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user (to check if he is in the conversation)
 * @param {number} limit - The number of messages to retrieve.
 * @returns {Promise<Object|null>} - The conversation object with its recent messages, or null if not found.
 */
async function getConversationWithRecentMessages(conversationId, userId, limit = 10) {
    const conversation = await mongoOperation(() =>
        db.collection(conversationCollection).aggregate([
            {$match: {_id: new ObjectId(conversationId)}},
            {
                $lookup: {
                    from: messageCollection,
                    let: {convId: "$_id"},
                    pipeline: [
                        {$match: {$expr: {$eq: ["$conversationId", "$$convId"]}}},
                        {$sort: {timestamp: -1}},
                        {$limit: limit}
                    ],
                    as: "messages"
                }
            }
        ]).toArray()
    );

    if (!conversation.length)
        throw new Error(DATABASE_ERRORS.CONVERSATION_NOT_FOUND);

    const participants = conversation[0].participants;
    const isParticipant = participants.some(participantId =>
        participantId.toString() === userId.toString()
    );

    if (!isParticipant)
        throw new Error(DATABASE_ERRORS.USER_NOT_PARTICIPANT);

    return conversation[0];
}

/**
 * Save a message in the database
 *
 * @param {Object} message - The message object to be saved.
 * @returns {Promise<void>} - A promise that resolves when the message is saved.
 */
async function saveMessage(message) {
    message.conversationId = new ObjectId(message.conversationId);
    await mongoOperation(() => {
        db.collection(messageCollection).insertOne(message);
    });
}

/**
 * Adds a participant to an existing conversation.
 *
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user to add.
 * @returns {Promise<void>}
 * @throws {Error} If the conversation does not exist.
 */
async function addParticipant(conversationId, userId) {
    const result = await mongoOperation(() =>
        db.collection(conversationCollection).updateOne(
            {_id: new ObjectId(conversationId)},
            {$addToSet: {participants: userId}}
        ));

    if (result.matchedCount === 0)
        throw new Error(`Conversation with ID ${conversationId} not found.`);

    if (result.modifiedCount === 0)
        throw new Error(`User ${userId} is already a participant.`);
}

/**
 * Checks if a user exists in the database.
 *
 * @param {string} userId - The ID of the user.
 * @returns {Promise<boolean>} - `true` if the user exists, otherwise `false`.
 */
async function userExists(userId) {
    const user = await db.collection(userCollection).findOne({_id: new ObjectId(userId)});
    return !!user;
}

/**
 * Check is list of users exists in the database
 *
 * @param userIds - The IDs of the users
 * @returns {Promise<boolean>} - `true` if the users exists, otherwise `false`.
 */
async function allUsersExist(userIds) {
    const userExistenceChecks = await Promise.all(
        userIds.map(async (userId) => {
            return await userExists(userId);
        })
    );
    return userExistenceChecks.every((exists) => exists);
}

/**
 * Creates a new conversation with the given participants.
 *
 * @param {string[]} participantIds - Array of participant user IDs.
 * @returns {Promise<Object>} - The created conversation object.
 */
async function createConversation(participantIds) {
    if (!await allUsersExist(participantIds)) {
        throw new Error(DATABASE_ERRORS.PARTICIPANT_NOT_FOUND);
    }

    const conversation = {
        participants: participantIds,
        createdAt: new Date()
    };

    const result = await mongoOperation(() =>
        db.collection(conversationCollection).insertOne(conversation));

    return {_id: result.insertedId, ...conversation};
}

module.exports = {
    getConversationWithRecentMessages,
    getUserConversationsWithLastMessage,
    createConversation,
    saveMessage
};