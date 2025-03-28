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
const DEFAULT_MESSAGE_LIMIT = 100;

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
 * Retrieves conversations along with their messages based on the specified filters.
 * Optionally removes the current user from the participants list.
 *
 * @async
 * @param {Object} params - Parameters for the function.
 * @param {Object} params.conversationFilter - Filters to select conversations (e.g., a specific user in the participants).
 * @param {Object} [params.messageFilter={}] - Filters to refine the messages (e.g., by sender or date).
 * @param {number} [params.messageLimit=DEFAULT_MESSAGE_LIMIT] - Limit the number of messages returned for each conversation.
 * @param {string|null} [params.excludeUserId=null] - The user ID to exclude from the participants list (optional).
 * @param {number} [params.sortMessageOrder=1] - Sorting order for messages (-1 for descending, 1 for ascending).
 * @returns {Promise<Array>} - A promise that resolves to an array of conversations, each with an array of messages.
 */
async function getConversationsWithMessages({
                                                conversationFilter,
                                                messageFilter = {},
                                                messageLimit = DEFAULT_MESSAGE_LIMIT,
                                                excludeUserId = null,
                                                sortMessageOrder = 1
                                            }) {
    return await mongoOperation(() =>
        db.collection(conversationCollection).aggregate([
            {$match: conversationFilter},
            {
                $lookup: {
                    from: messageCollection,
                    let: {convId: "$_id"},
                    pipeline: [
                        {
                            $match: {
                                $expr: {$eq: ["$conversationId", "$$convId"]},
                                ...messageFilter
                            }
                        },
                        {$sort: {timestamp: sortMessageOrder}},
                        {$limit: messageLimit},
                        {
                            $lookup: {
                                from: "users",
                                localField: "senderId",
                                foreignField: "_id",
                                as: "senderInfo"
                            }
                        },
                        {
                            $addFields: {
                                senderInfo: {$arrayElemAt: ["$senderInfo", 0]}
                            }
                        },
                        {
                            $project: {
                                _id: 1, content: 1, senderId: 1, senderName: "$senderInfo.name", timestamp: 1, isRead: 1
                            }
                        }
                    ],
                    as: "messages"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "participants",
                    foreignField: "_id",
                    as: "participantsInfo"
                }
            },
            {
                $addFields: {
                    participants: {
                        $map: {
                            input: "$participantsInfo",
                            as: "participant",
                            in: {
                                id: {$toString: "$$participant._id"},
                                name: "$$participant.name"
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    lastMessageDate: {
                        $cond: {
                            if: {$gt: [{$size: "$messages"}, 0]},
                            then: {$arrayElemAt: ["$messages.timestamp", 0]},
                            else: "$createdAt"
                        }
                    }
                }
            },
            {
                $sort: {lastMessageDate: -1}
            },
            {
                $addFields: {
                    messages: {
                        $arrayToObject: {
                            $map: {
                                input: "$messages",
                                as: "msg",
                                in: {k: {$toString: "$$msg._id"}, v: "$$msg"}
                            }
                        }
                    }
                }
            },
            ...(excludeUserId
                    ? [{
                        $set: {
                            participants: {
                                $filter: {
                                    input: "$participants",
                                    as: "participant",
                                    cond: {$ne: ["$$participant.id", excludeUserId]}
                                }
                            }
                        }
                    }]
                    : []
            ),
            {
                $project: {
                    _id: 1,
                    participants: 1,
                    isGlobal: {$cond: {if: {$gt: ["$isGlobal", null]}, then: "$isGlobal", else: "$$REMOVE"}},
                    messages: 1,
                    createdAt: 1
                }
            }
        ]).toArray()
    );
}

/**
 * Retrieves all conversations of a user with their latest message.
 *
 * @async
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} - List of conversations with the last message.
 */
async function getUserConversationsWithLastMessage(userId) {
    const conversations = await getConversationsWithMessages({
        conversationFilter: {participants: new ObjectId(userId)},
        messageLimit: 1,
        excludeUserId: userId,
        sortMessageOrder: -1
    });

    const globalConversation = await getConversationsWithMessages({
        conversationFilter: {_id: new ObjectId(GLOBAL_CONVERSATION_ID)},
        messageLimit: DEFAULT_MESSAGE_LIMIT
    });

    if (globalConversation.length)
        conversations.push(globalConversation[0]);
    return conversations;
}

/**
 * Retrieves a conversation with a limited number of recent messages from a specified date.
 *
 * @async
 * @param {string} conversationId - The ID of the conversation.
 * @param {string} userId - The ID of the user (to check if he is in the conversation)
 * @param {string|Date|null} date - The reference date to fetch messages before.
 * @param {number} limit - The number of messages to retrieve.
 * @throws {Error} `CONVERSATION_NOT_FOUND` - If the conversation does not exist
 * @throws {Error} `USER_NOT_PARTICIPANT` - If the user is not a participant of the conversation
 * @returns {Promise<Object|null>} - The conversation object with its recent messages, or null if not found.
 */
async function getConversationWithMessagesBeforeDate(conversationId, userId, date = new Date(), limit = DEFAULT_MESSAGE_LIMIT) {
    const conversations = await getConversationsWithMessages({
        conversationFilter: {
            _id: new ObjectId(conversationId),
            $or: [
                {participants: {$in: [new ObjectId(userId)]}},
                {isGlobal: true}
            ]
        },
        messageFilter: {timestamp: {$lt: new Date(date)}},
        messageLimit: limit,
        excludeUserId: userId
    });

    if (!conversations.length)
        throw new Error(DATABASE_ERRORS.CONVERSATION_NOT_FOUND);

    const conversation = conversations[0];

    if (conversation.messages) {
        const messagesNotRead = Object.values(conversation.messages)
            .filter(message => !message.isRead)
            .map(message => message._id);

        await markMessagesAsRead(messagesNotRead, userId);

        messagesNotRead.forEach(msgId => {
            if (conversation.messages[msgId])
                conversation.messages[msgId].isRead = true;
        });
    }

    return conversation;
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
 * Check is list of users exists in the database
 *
 * @async
 * @param userIds - The IDs of the users
 * @returns {Promise<boolean>} - `true` if the users exists, otherwise `false`.
 */
async function allUsersExist(userIds) {
    const users = await db.collection(userCollection).find({
        _id: {$in: userIds.map(id => new ObjectId(id))}
    }).toArray();

    return users.length === userIds.length;
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
    if (!await allUsersExist(participantIds))
        throw new Error(DATABASE_ERRORS.PARTICIPANT_NOT_FOUND);

    const conversation = {
        participants: participantIds.map(id => new ObjectId(id)),
        createdAt: new Date()
    };

    const result = await mongoOperation(() =>
        db.collection(conversationCollection).insertOne(conversation));

    return result.insertedId.toString();
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

/**
 * Deletes all messages and conversations related to the given user.
 *
 * @async
 * @function
 * @param {string} userId - The ID of the user whose messages and conversations should be deleted.
 * @throws {Error} If there is a failure in the MongoDB operations.
 */
async function deleteUser(userId) {
    await mongoOperation(() => db.collection(messageCollection).deleteMany({senderId: new ObjectId(userId)}));
    await mongoOperation(() => db.collection(conversationCollection).deleteMany({
        participants: new ObjectId(userId),
        $expr: {$eq: [{$size: "$participants"}, 2]}
    }));
}

/**
 * Retrieves the ID of an existing conversation between two users.
 *
 * This function searches the conversation collection for a private (non-global) conversation
 * that contains exactly the two specified users. It returns the conversation ID if found.
 *
 * @async
 * @function getConversationIdIfExists
 * @param {string} userId1 - The ID of the first user.
 * @param {string} userId2 - The ID of the second user.
 * @returns {Promise<Object[]>} A promise resolving to an array containing the conversation ID if found,
 *                              or an empty array if no conversation exists.
 */
async function getConversationIdIfExists(userId1, userId2) {
    return await mongoOperation(() =>
        db.collection(conversationCollection).aggregate([
            {
                $match: {
                    participants: {$all: [new ObjectId(userId1), new ObjectId(userId2)]},
                    isGlobal: {$ne: true}
                }
            },
            {
                $project: {
                    _id: 1
                }
            }
        ]).toArray()
    );
}

module.exports = {
    createGlobalConversation,
    deleteMessageWithOwner,
    getConversationWithMessagesBeforeDate,
    getUserConversationsWithLastMessage,
    createConversation,
    saveMessage,
    markMessagesAsRead,
    getConversationIdIfExists,
    deleteUser
};