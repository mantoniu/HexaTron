const {MongoClient, ObjectId} = require("mongodb");
const {DATABASE_ERRORS} = require("./utils");

const conversationCollection = process.env.CONVERSATION_COLLECTION;
const messageCollection = process.env.MESSAGE_COLLECTION;
const userCollection = process.env.USER_COLLECTION;

const dbName = process.env.DB_NAME;
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(dbName);

const GLOBAL_CONVERSATION_ID = process.env.GLOBAL_CONVERSATION_ID;
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
 * @async
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
 * Retrieves a conversation with a limited number of recent messages from a specified date.
 *
 * @async
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user (to check if he is in the conversation)
 * @param {string|Date} date - The reference date to fetch messages before.
 * @param {number} limit - The number of messages to retrieve.
 * @throws {Error} `CONVERSATION_NOT_FOUND` - If the conversation does not exist
 * @throws {Error} `USER_NOT_PARTICIPANT` - If the user is not a participant of the conversation
 * @returns {Promise<Object|null>} - The conversation object with its recent messages, or null if not found.
 */
async function getConversationWithMessagesBeforeDate(conversationId, userId, date, limit = 10) {
    const conversation = await mongoOperation(() =>
        db.collection(conversationCollection).aggregate([
            {$match: {_id: new ObjectId(conversationId)}},
            {
                $lookup: {
                    from: messageCollection,
                    let: {convId: "$_id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {$eq: ["$conversationId", "$$convId"]},
                                timestamp: {$lt: new Date(date)}
                            }
                        },
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
 * @async
 * @param {Object} message - The message object to be saved.
 * @returns {Promise<string>} - A promise that resolves when the message is saved with the id of the message.
 */
async function saveMessage(message) {
    message.senderId = new ObjectId(message.senderId);
    message.conversationId = new ObjectId(message.conversationId);
    const result = await db.collection(messageCollection).insertOne(message);
    return result.insertedId.toString();
}

/**
 * Deletes a message if the user is the sender.
 *
 * @async
 * @param {string} messageId - The ID of the message to be deleted.
 * @param {string} userId - The ID of the user attempting to delete the message.
 * @throws {Error} `MESSAGE_NOT_FOUND` - If the message does not exist in the database.
 * @throws {Error} `USER_NOT_OWNER` - If the user is not the sender of the message.
 * @returns {Promise<string>} - Resolves when the message is successfully deleted and gives the conversationId.
 */
async function deleteMessageWithOwner(messageId, userId) {
    return await mongoOperation(async () => {
        const message = await db.collection(messageCollection).findOneAndDelete({
            _id: new ObjectId(messageId),
            senderId: new ObjectId(userId)
        });

        if (!message)
            throw new Error(DATABASE_ERRORS.MESSAGE_NOT_FOUND);

        return message.conversationId.toString();
    });
}

/**
 * Adds a participant to an existing conversation.
 *
 * @async
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user to add.
 * @throws {Error} If the conversation does not exist.
 * @returns {Promise<void>}
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
 * @async
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
 * @async
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
 * @async
 * @param {string[]} participantIds - Array of participant user IDs.
 * @throws {Error} `PARTICIPANT_NOT_FOUND` - If one of the participant cannot be found
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

/**
 * Updates a message in the database by applying the specified changes.
 *
 * @async
 * @param {string} messageId - The ID of the message to update.
 * @param {Object} updateFields - The fields to update in the message.
 * @throws {Error} `MESSAGE_NOT_FOUND` - If no message with the given ID is found.
 * @throws {Error} `UPDATE_FAILURE` - If the update operation did not modify any document.
 * @returns {Promise<Object>} - Returns `{ success: true }` if the update is successful.
 */
async function updateMessage(messageId, updateFields) {
    const result = await mongoOperation(() =>
        db.collection(messageCollection).updateOne(
            {_id: new ObjectId(messageId)},
            {$set: updateFields}
        )
    );

    if (!result.matchedCount)
        throw new Error(DATABASE_ERRORS.MESSAGE_NOT_FOUND);
}

/**
 * Marks specific messages as read in the database.
 *
 * @async
 * @param {string[]} messageIds - Array of message IDs to be marked as read.
 * @param {string} userId - The ID of the user making the request.
 *                          Ensures the user cannot mark their own messages as read.
 * @returns {Promise<void>} Resolves when the update is complete.
 * @throws {Error} Throws an error if the database operation fails.
 */
async function markMessagesAsRead(messageIds, userId) {
    await db.collection(messageCollection).updateMany(
        {
            _id: {$in: messageIds.map(id => new ObjectId(id))},
            senderId: {$ne: new ObjectId(userId)},
            isRead: false
        },
        {$set: {isRead: true}}
    );
}

/**
 * Creates a global conversation if it does not already exist.
 *
 * @async
 * @returns {Promise<void>} - Resolves when the operation is complete.
 *                           Logs success or failure messages.
 */
async function createGlobalConversation() {
    const existingGlobal = await db.collection(conversationCollection)
        .findOne({_id: new ObjectId(GLOBAL_CONVERSATION_ID)});

    if (!existingGlobal) {
        const result = await db.collection(conversationCollection).insertOne({
            _id: new ObjectId(GLOBAL_CONVERSATION_ID),
            createdAt: new Date(),
            isGlobal: true
        });

        if (result.acknowledged && result.insertedId)
            console.log(`Global conversation created successfully`);
        else
            console.error("Failed to create global conversation.");
    } else
        console.log("Global conversation already exists.");
}

module.exports = {
    createGlobalConversation,
    deleteMessageWithOwner,
    getConversationWithMessagesBeforeDate,
    getUserConversationsWithLastMessage,
    createConversation,
    saveMessage
};