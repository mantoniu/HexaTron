const {parse} = require('url');
const {getIDInRequest, HttpError} = require("../utils/controller-utils");
const {
    getUserConversationsWithLastMessage,
    createConversation, getConversationWithMessagesBeforeDate
} = require("./database");
const {DATABASE_ERRORS} = require("./utils");

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

exports.createConversation = async (req, res) => {
    try {
        const participants = req.body;
        const conversation = await createConversation(participants);

        res.writeHead(201, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            message: "Conversation successfully created.",
            conversation: conversation
        }));
    } catch (error) {
        if (error.message === DATABASE_ERRORS.PARTICIPANT_NOT_FOUND)
            throw new HttpError(404, "One or more participants do not exist.");

        if (error.message === DATABASE_ERRORS.VALIDATION_FAILED)
            throw new HttpError(400, "The conversation data is invalid.");

        throw new HttpError(500, error.message);
    }
};

exports.health = async (req, res) => {
    res.writeHead(204);
    res.end();
};