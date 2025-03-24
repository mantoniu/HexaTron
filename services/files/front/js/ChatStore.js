/**
 * ChatStore is responsible for managing conversation data locally.
 * It serves as a temporary storage layer for chat conversations.
 */
class ChatStore {
    constructor() {
        this._conversations = new Map();
        this._conversationOrder = [];

        this._globalConversationId = null;
        this._fetchedConversations = new Set();
        this._conversationsFetched = false;
    }

    /**
     * Stores or updates a conversation in the store.
     * If the conversation exists, it merges the new data with the existing one.
     *
     * @param {Object} conversation - The conversation object.
     */
    setConversation(conversation) {
        if (conversation.isGlobal) {
            this._globalConversationId = conversation._id;
            this.markAsFetched(conversation._id);
        }

        const existing = this._conversations.get(conversation._id) || {};
        const merged = {
            ...existing,
            ...conversation,
            messages: this._mergeMessages(existing.messages, conversation.messages)
        };

        if (!this._conversationOrder.includes(conversation._id))
            this._conversationOrder.push(conversation._id);

        this._conversations.set(conversation._id, merged);
    }

    /**
     * Adds a new message to a specific conversation (at the end of the list).
     *
     * @param {string} conversationId - The ID of the conversation.
     * @param {Object} message - The message object to be added.
     */
    addMessage(conversationId, message) {
        const conversation = this._conversations.get(conversationId);
        if (!conversation)
            return;

        if (!conversation.messages)
            conversation.messages = new Map();

        conversation.messages.set(message._id, message);
        this._moveConversationToTop(conversationId);
    }

    /**
     * Updates an existing message in a conversation.
     *
     * @param {string} conversationId - The ID of the conversation.
     * @param {string} messageId - The ID of the message to update.
     * @param {Object} newMessageData - The new data to update the message with.
     */
    updateMessage(conversationId, messageId, newMessageData) {
        const conversation = this._conversations.get(conversationId);
        if (!conversation)
            return;

        const existingMessage = conversation.messages?.get(messageId);
        if (!existingMessage)
            return;

        const updatedMessage = {
            ...existingMessage,
            ...newMessageData
        };

        conversation.messages.set(messageId, updatedMessage);
    }

    /**
     * Deletes a message from a specific conversation.
     *
     * @param {string} conversationId - The ID of the conversation.
     * @param {string} messageId - The ID of the message to delete.
     */
    deleteMessage(conversationId, messageId) {
        const conversation = this._conversations.get(conversationId);
        if (conversation?.messages) {
            conversation.messages.delete(messageId);
        }
    }

    /**
     * Replaces a temporary message with the server-confirmed message.
     *
     * @param {string} conversationId - The ID of the conversation.
     * @param {string} tempId - The temporary message ID.
     * @param {Object} serverMessage - The final message object from the server.
     */
    replaceMessage(conversationId, tempId, serverMessage) {
        const conversation = this._conversations.get(conversationId);
        if (!conversation?.messages)
            return;

        if (conversation.messages.has(tempId))
            conversation.messages.delete(tempId);

        conversation.messages.set(serverMessage._id, serverMessage);
    }

    /**
     * Moves a conversation to the top of the conversation order.
     *
     * @param {string} conversationId - The ID of the conversation to move.
     */
    _moveConversationToTop(conversationId) {
        const index = this._conversationOrder.indexOf(conversationId);
        if (index !== -1)
            this._conversationOrder.splice(index, 1);

        this._conversationOrder.unshift(conversationId);
    }

    /**
     * Merge existing messages with new messages.
     *
     * @param {Map} existingMessages - Existing messages (Map).
     * @param {Object} newMessages - New messages to merge.
     * @returns {Map} - Merged messages as a Map.
     */
    _mergeMessages(existingMessages, newMessages) {
        const messages = new Map(existingMessages);

        if (newMessages) {
            const tempMessages = new Map();

            Object.values(newMessages).forEach(message => {
                if (!messages.has(message._id))
                    tempMessages.set(message._id, message);
                else
                    messages.set(message._id, message);
            });

            return new Map([...tempMessages, ...messages]);
        }

        return messages;
    }

    /**
     * Retrieves all stored conversations.
     *
     * @returns {Object[]} An array of conversation objects.
     */
    getConversations() {
        return this._conversationOrder
            .filter(id => id !== this._globalConversationId)
            .map(id => this._conversations.get(id));
    }

    /**
     * Retrieves a conversation by its ID.
     *
     * @param {string} conversationId - The ID of the conversation.
     * @returns {Object|null} The conversation object or null if not found.
     */
    getConversation(conversationId) {
        return this._conversations.get(conversationId) || null;
    }

    /**
     * Marks all conversations as fetched.
     * This is used to indicate that the initial batch of conversations has been retrieved.
     */
    markConversationsAsFetched() {
        this._conversationsFetched = true;
    }

    /**
     * Checks if conversations have already been fetched.
     *
     * @returns {boolean} True if conversations have been fetched, otherwise false.
     */
    areConversationsFetched() {
        return this._conversationsFetched;
    }

    /**
     * Marks a specific conversation as fetched.
     * This prevents redundant fetching of the same conversation.
     *
     * @param {string} conversationId - The ID of the conversation to mark as fetched.
     */
    markAsFetched(conversationId) {
        this._fetchedConversations.add(conversationId);
    }

    /**
     * Checks if a specific conversation has already been fetched.
     *
     * @param {string} conversationId - The ID of the conversation.
     * @returns {boolean} True if the conversation has been fetched, otherwise false.
     */
    isFetched(conversationId) {
        return this._fetchedConversations.has(conversationId);
    }

    /**
     * Retrieves the ID of the global conversation.
     *
     * @returns {string|null} The global conversation ID, or null if not set.
     */
    getGlobalConversationId() {
        return this._globalConversationId;
    }

    /**
     * Clears all stored conversations and resets the chat store.
     * This is typically used when the user logs out to prevent data leakage.
     */
    clear() {
        this._conversations.clear();
        this._conversationOrder = [];
        this._globalConversationId = null;
        this._fetchedConversations.clear();
        this._conversationsFetched = false;
    }

    updateFriend(friend) {
        this._conversations.forEach((conversation, _) => {
            conversation.participants.forEach(participant => {
                if (participant.id === friend.id)
                    participant.name = friend.friendData.name;
            });
            conversation.messages.forEach((message, _) => {
                if (message.senderId === friend.id)
                    message.senderName = friend.friendData.name;
            });
        });
    }
}

export const chatStore = new ChatStore();