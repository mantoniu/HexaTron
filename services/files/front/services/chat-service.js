import {socketService} from "./socket-service.js";

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

        ChatService._instance = this;
    }

    static getInstance() {
        if (!ChatService._instance)
            ChatService._instance = new ChatService();

        return ChatService._instance;
    }
}

export const chatService = ChatService.getInstance();