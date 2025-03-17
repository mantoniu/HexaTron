/**
 * Service for managing Socket.IO connections.
 *
 * @class
 */
class SocketService {
    /**
     * Singleton instance of SocketService.
     *
     * @static
     * @type {SocketService}
     */
    static _instance = null;

    /**
     * Sockets managed by this service.
     *
     * @type {Object}
     * @property {Socket} game - Socket for the `/game` namespace.
     * @property {Socket} chat - Socket for the `/chat` namespace.
     */
    _sockets = {
        game: null,
        chat: null,
    };

    /**
     * Private constructor (singleton pattern).
     *
     * @private
     */
    constructor() {
        if (SocketService._instance)
            return SocketService._instance;

        const baseUrl = window.location.origin;
        this._sockets.game = io(`${baseUrl}/game`, {autoConnect: true});
        this._sockets.chat = io(`${baseUrl}/chat`, {autoConnect: true});

        this.setupListeners();

        SocketService._instance = this;
    }

    /**
     * Returns the socket for the `/game` namespace.
     *
     * @returns {Socket} The game socket.
     */
    get gameSocket() {
        return this._sockets.game;
    }

    /**
     * Returns the socket for the `/chat` namespace.
     *
     * @returns {Socket} The chat socket.
     */
    get chatSocket() {
        return this._sockets.chat;
    }

    /**
     * Returns the singleton instance of SocketService.
     *
     * @static
     * @returns {SocketService} The singleton instance.
     */
    static getInstance() {
        if (!SocketService._instance)
            SocketService._instance = new SocketService();

        return SocketService._instance;
    }

    /**
     * Sets up event listeners for the sockets.
     *
     * @private
     */
    setupListeners() {
        this._sockets.game.on('connect', () => console.log('[GameSocket] Connected:', this._sockets.game.id));
        this._sockets.game.on('disconnect', () => console.warn('[GameSocket] Disconnected!'));

        this._sockets.chat.on('connect', () => console.log('[ChatSocket] Connected:', this._sockets.chat.id));
        this._sockets.chat.on('disconnect', () => console.warn('[ChatSocket] Disconnected!'));
    }
}

export const socketService = SocketService.getInstance();