import {socketService} from "./socket-service.js";
import {chatStore} from "../js/ChatStore.js";
import {apiClient} from "../js/ApiClient.js";
import {USER_EVENTS, userService} from "./user-service.js";
import {EventEmitter} from "../js/EventEmitter.js";

/**
 *  Defines the chat events
 *
 * @constant {Object}
 */
export const CHAT_EVENTS = Object.freeze({
    CONVERSATIONS_UPDATED: "CONVERSATIONS_UPDATED",
    CONVERSATION_UPDATED: "CONVERSATION_UPDATED",
    MESSAGE_ADDED: "MESSAGE_ADDED",
    MESSAGE_REPLACED: "MESSAGE_REPLACED",
    MESSAGE_DELETED: "MESSAGE_DELETED",
    MESSAGE_SENT: "MESSAGE_SENT"
});

/**
 * Service for chat management.
 * This class implements the Singleton pattern to ensure a single instance.
 *
 * @class GameService
 * @singleton
 */
class ChatService extends EventEmitter {
    static _instance = null;

    constructor() {
        super();

        if (ChatService._instance)
            return ChatService._instance;

        this._socket = socketService.chatSocket;
        this._apiUrl = "api/chat";
        this._setupListeners();

        ChatService._instance = this;

        userService.on(USER_EVENTS.CONNECTION, () => this._fetchConversations());

        this._chatStore = chatStore;
    }

    /**
     * Initializes the chat service.
     * If the user is already connected, it fetches their conversations.
     * Also sets up listeners for login and logout events.
     *
     * @async
     * @returns {Promise<void>} Resolves when the initialization is complete.
     */
    async init() {
        if (userService.isConnected())
            await this._fetchConversations();

        userService.on(USER_EVENTS.CONNECTION, async () =>
            await this._fetchConversations());

        userService.on(USER_EVENTS.LOGOUT, () =>
            this._chatStore.clear());
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
     * Sets up event listeners for chat updates received from the server.
     *
     * @private
     */
    _setupListeners() {
        this._socket.on("message", (conversationId, message) => {
            this._chatStore.addMessage(conversationId, message);
            this.emit(CHAT_EVENTS.MESSAGE_ADDED, conversationId, message);
        });

        this._socket.on("deleteMessage", (conversationId, messageId) => {
            this._chatStore.deleteMessage(conversationId, messageId);
            this.emit(CHAT_EVENTS.MESSAGE_DELETED, conversationId, messageId);
        });

        this._socket.on("error", (error) => console.error(error));
    }

    /**
     * Retrieves the global conversation.
     *
     * @returns {Object|null} The global conversation object or null if not found.
     */
    getGlobalConversation() {
        return this.getConversation(this._chatStore.getGlobalConversationId());
    }

    /**
     * Retrieves a specific conversation by its ID.
     * If not already fetched, it fetches the conversation from the API.
     *
     * @async
     * @param {string} conversationId - The ID of the conversation to retrieve.
     * @returns {Promise<Object|null>} The conversation object or null if not found.
     */
    async getConversation(conversationId) {
        if (this._chatStore.isFetched(conversationId)) {
            const conversation = this._chatStore.getConversation(conversationId);

            const toMark = Array.from(conversation?.messages.values())
                .filter(message => !message.isRead)
                .map(message => message._id);

            if (toMark.length)
                this._markMessagesAsRead(conversationId, toMark);

            return this._chatStore.getConversation(conversationId);
        }

        await this._fetchConversation(conversationId);
        return this._chatStore.getConversation(conversationId);
    }

    /**
     * Retrieves all conversations for the current user.
     * If conversations are not already fetched, it fetches them from the API.
     *
     * @async
     * @returns {Promise<Object[]>} An array of conversation objects.
     */
    async getConversations() {
        if (this._chatStore.areConversationsFetched())
            return this._chatStore.getConversations();

        await this._fetchConversations();
        return this._chatStore.getConversations();
    }

    /**
     * Joins multiple conversations via WebSocket.
     *
     * @private
     * @param {Array<{_id: string}>} conversations - The list of conversations to join.
     */
    _joinConversations(conversations) {
        const conversationIds = conversations.map(conversation => conversation._id);
        this._socket.emit("joinConversations", conversationIds);
    }

    /**
     * Fetches a single conversation by its ID from the server.
     * If successful, the conversation is stored locally.
     *
     * @async
     * @private
     * @param {string} conversationId - The ID of the conversation to fetch.
     * @returns {Promise<void>}
     */
    async _fetchConversation(conversationId) {
        const response = await apiClient.request("GET", `${this._apiUrl}/conversations/${conversationId}`);

        if (!response.success) {
            console.error("Error while fetching conversation", conversationId);
            return;
        }

        this._chatStore.setConversation(response.data.conversation);
        this._chatStore.markAsFetched(conversationId);
    }

    /**
     * Fetches all conversations for the current user from the server.
     * If successful, stores them locally and joins their WebSocket rooms.
     *
     * @async
     * @private
     * @returns {Promise<void>}
     */
    async _fetchConversations() {
        const response = await apiClient.request("GET", `${this._apiUrl}/conversations`);

        if (!response.success) {
            console.error("Error while fetching conversations");
            return;
        }

        this._joinConversations(response.data.conversations);

        response.data.conversations.forEach(conv => this._chatStore.setConversation(conv));
        this.emit(CHAT_EVENTS.CONVERSATIONS_UPDATED);
        this._chatStore.markConversationsAsFetched();
    }

    /**
     * Marks messages as read in a conversation and notifies the server.
     *
     * @private
     * @param {string} conversationId - The ID of the conversation.
     * @param {string[]} messageIds - The IDs of the messages to mark as read.
     */
    _markMessagesAsRead(conversationId, messageIds) {
        this._socket.emit("messagesRead", messageIds, conversationId, userService.user._id);

        messageIds.forEach(id =>
            this._chatStore.updateMessage(conversationId, id, {isRead: true}));
    }

    /**
     * Marks a single message as read.
     *
     * @param {string} conversationId - The ID of the conversation.
     * @param {string} messageId - The ID of the message to mark as read.
     */
    markAsRead(conversationId, messageId) {
        this._markMessagesAsRead(conversationId, [messageId]);
    }

    /**
     * Sends a message to a conversation via WebSocket.
     *
     * @param {string} conversationId - The ID of the conversation to send the message to.
     * @param {string} content - The message content.
     */
    sendMessage(conversationId, content) {
        const tempId = `temp-${Date.now()}`;
        const message = {
            _id: tempId,
            senderId: userService.user._id,
            content,
            timestamp: new Date().toISOString(),
            isPending: true
        };

        this._chatStore.addMessage(conversationId, message);
        this.emit(CHAT_EVENTS.MESSAGE_ADDED, conversationId, message);
        this._socket.emit("message", content, conversationId, userService.user._id, (serverMessage) => {
            this._chatStore.replaceMessage(conversationId, tempId, serverMessage);
            this.emit(CHAT_EVENTS.MESSAGE_SENT, tempId, serverMessage, conversationId);
        });
    }

    /**
     * Deletes a message via WebSocket
     *
     * @param {string} conversationId - The ID of the conversation
     * @param {string} messageId - The ID of the message to be deleted
     */
    deleteMessage(conversationId, messageId) {
        this._socket.emit("deleteMessage", messageId, userService.user._id);
    }
}

export const chatService = ChatService.getInstance();
await chatService.init();