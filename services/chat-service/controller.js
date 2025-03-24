const {parse} = require('url');
const {getIDInRequest, HttpError} = require("../utils/controller-utils");
const {
    getUserConversationsWithLastMessage,
    getConversationWithMessagesBeforeDate
} = require("./database");
const {DATABASE_ERRORS} = require("./utils");
const {readData} = require("../utils/api-utils");

/**
 * Handles the retrieval of conversations for a user.
 *
 * If a `conversationId` is provided in the URL, the function retrieves the specified conversation
 * along with its messages before a given date. If no `conversationId` is provided, it retrieves
 * all conversations of the user with their last message.
 *
 * @async
 * @function getConversations
 * @param {IncomingMessage} req - The HTTP request object.
 * @param {ServerResponse} res - The HTTP response object.
 * @throws {HttpError} - Throws a 404 error if the conversation is not found.
 * @throws {HttpError} - Throws a 500 error for any unexpected server issue.
 */
exports.getConversations = async (req, res) => {
    try {
        const userId = getIDInRequest(req);
        const conversationId = parse(req.url, true).pathname.split('/')?.[4];

        const url = new URL(req.url, `http://${req.headers.host}`);
        const date = url.searchParams.get('date') || new Date();

        const response = conversationId
            ? {
                message: "Conversation retrieved successfully.",
                conversation: await getConversationWithMessagesBeforeDate(conversationId, userId, date),
            }
            : {
                message: "User conversations retrieved successfully.",
                conversations: await getUserConversationsWithLastMessage(userId),
            };

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify(response));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        if (error.message === DATABASE_ERRORS.CONVERSATION_NOT_FOUND)
            throw new HttpError(404, "Conversation not found.");

        throw new HttpError(500, error.message);
    }
};

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
        res.end(readData(process.env.CHAT_API));
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