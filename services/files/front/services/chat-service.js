import {socketService} from "./socket-service.js";
import {apiClient, DEFAULT_ERROR_MESSAGES} from "../js/ApiClient.js";
import {userService} from "./user-service.js";

/**
 * Defines available chat actions.
 *
 * @constant {Object}
 */
export const CHAT_ACTIONS = Object.freeze({
    CREATE_CONVERSATION: "createConversation",
    GET_CONVERSATION: "getConversation"
});

/**
 * Error messages mapped to chat actions and HTTP status codes.
 *
 * @constant {Object}
 */
const ERROR_MESSAGES = {
    [CHAT_ACTIONS.CREATE_CONVERSATION]: {
        404: "One or more participants do not exits.",
        400: "Unable to create conversation: invalid or missing data."
    },
    [CHAT_ACTIONS.GET_CONVERSATION]: {
        404: "The requested conversation does not exist or may have been deleted.",
        401: "You are not authorized to access this conversation."
    }
};

/**
 * Service for chat management.
 * This class implements the Singleton pattern to ensure a single instance.
 *
 * @class GameService
 * @singleton
 */
class ChatService {
    static _instance = null;

    constructor() {
        if (ChatService._instance)
            return ChatService._instance;

        this._socket = socketService.chatSocket;
        this._apiUrl = "api/chat";

        this._socket.on("message", (data) => console.log(data));
        this._socket.on("error", (error) => console.error(error));

        ChatService._instance = this;
    }

    /**
     * Retrieves the singleton instance of ChatService.
     *
     * @returns {ChatService} The singleton instance.
     */
    static getInstance() {
        if (!ChatService._instance)
            ChatService._instance = new ChatService();

        return ChatService._instance;
    }

    /**
     * Retrieves an error message based on HTTP status and action type.
     *
     * @private
     * @param {number} status - The HTTP status code.
     * @param {string|null} action - The user action being performed.
     * @returns {string} The corresponding error message.
     */
    _getErrorMessage(status, action = null) {
        return ERROR_MESSAGES[action]?.[status] || DEFAULT_ERROR_MESSAGES[status] || "An unknown error has occurred.";
    }

    /**
     * Retrieves a conversation by its ID.
     *
     * @async
     * @param {string} conversationId - The ID of the conversation to retrieve.
     * @returns {Promise<{success: boolean, conversation?: Object, error?: string}>}
     *          - success: Indicates if the request was successful.
     *          - conversation (optional): The retrieved conversation if successful.
     *          - error (optional): The error message if the request fails.
     */
    async getConversation(conversationId) {
        const response = await apiClient.request("GET", `${this._apiUrl}/conversations/${conversationId}`);
        console.log(response);
        if (response.success) {
            return {success: true, conversation: response.data.conversation};
        }
        return {success: false, error: this._getErrorMessage(response.status, CHAT_ACTIONS.GET_CONVERSATION)};
    }

    /**
     * Joins multiple conversations via WebSocket.
     *
     * @private
     * @param {Array<{_id: string}>} conversations - The list of conversations to join.
     */
    _joinConversations(conversations) {
        console.log(conversations);
        conversations.forEach(conversation =>
            this._socket.emit("joinConversation", conversation._id)
        );
    }

    /**
     * Retrieves the list of conversations for the current user.
     *
     * @async
     * @returns {Promise<{success: boolean, conversations?: Object[], error?: string}>}
     *          - success: Indicates if the request was successful.
     *          - conversations (optional): An array of conversations if successful.
     *          - error (optional): The error message if the request fails.
     */
    async getConversations() {
        const response = await apiClient.request("GET", `${this._apiUrl}/conversations`);
        console.log(response);
        if (response.success) {
            this._joinConversations(response.data.conversations);
            return {success: true, conversations: response.data.conversations};
        }
        return {success: false, error: this._getErrorMessage(response.status)};
    }

    /**
     * Creates a new conversation with specified participants.
     *
     * @async
     * @param {string[]} participants - The IDs of the participants to include in the conversation.
     * @returns {Promise<{success: boolean, conversation?: Object, error?: string}>}
     *          - success: Indicates if the request was successful.
     *          - conversation (optional): The created conversation if successful.
     *          - error (optional): The error message if the request fails.
     */
    async createConversation(participants) {
        const response = await apiClient.request("POST", `${this._apiUrl}/conversations`, participants);
        console.log(response);
        if (response.success) {
            return {success: true, conversation: response.data.conversation};
        }
        return {success: false, error: this._getErrorMessage(response.status, CHAT_ACTIONS.CREATE_CONVERSATION)};
    }

    /**
     * Sends a message to a conversation via WebSocket.
     *
     * @param {string} conversationId - The ID of the conversation to send the message to.
     * @param {string} content - The message content.
     */
    sendMessage(conversationId, content) {
        this._socket.emit("message", content, conversationId, userService.user._id);
    }
}

export const chatService = ChatService.getInstance();