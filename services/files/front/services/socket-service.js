import {apiClient} from "../js/ApiClient.js";

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
     * @property {Socket} friends - Socket for the `/friends` namespace.
     * @property {Socket} notifications - Socket for the `/notifications` namespace.
     */
    _sockets = {
        game: null,
        chat: null,
        friends: null,
        notifications: null
    };

    /**
     * Private constructor (singleton pattern).
     *
     * @private
     */
    constructor() {
        if (SocketService._instance)
            return SocketService._instance;

        this.baseUrl = window.location.origin;
        SocketService._instance = this;
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
     * Connects to the game socket namespace.
     *
     * @returns {Socket} The connected game socket instance.
     */
    connectGameSocket() {
        return this._connectSocket("game");
    }

    /**
     * Connects to the chat socket namespace.
     *
     * @returns {Socket} The connected chat socket instance.
     */
    connectChatSocket() {
        return this._connectSocket("chat");
    }

    /**
     * Connects to the friends socket namespace.
     *
     * @returns {Socket} The connected friends socket instance.
     */
    connectFriendSocket() {
        return this._connectSocket("friends");
    }

    /**
     * Connects to the notifications socket namespace.
     *
     * @returns {Socket} The connected notifications socket instance.
     */
    connectNotificationsSocket() {
        return this._connectSocket("notifications");
    }

    /**
     * Generic method to connect to any socket namespace
     *
     * @private
     * @param {string} type - The socket type ('game', 'chat', 'friends' or 'notifications')
     * @returns {Socket} The connected socket instance
     */
    _connectSocket(type) {
        if (!Object.keys(this._sockets).includes(type)) {
            console.error(`Unknown socket type: ${type}`);
            return null;
        }

        const token = localStorage.getItem("accessToken");
        if (this._sockets[type]) {
            this._sockets[type].auth = {token};
            this._sockets[type].connect();
            return this._sockets[type];
        }

        // Configure socket options
        const options = {
            autoConnect: true,
            reconnection: true
        };

        // Add auth data if available
        options.auth = {token};

        // Create the socket
        this._sockets[type] = io(`${this.baseUrl}/${type}`, options);

        // Set up standard event listeners
        this._setupStandardListeners(type);

        return this._sockets[type];
    }

    /**
     * Set up standard event listeners for a socket
     *
     * @private
     * @param {string} type - The socket type
     */
    _setupStandardListeners(type) {
        const socket = this._sockets[type];
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);

        // Connection events
        socket.on('connect', () => {
            console.log(`[${capitalizedType}Socket] Connected: ${socket.id}`);
        });

        socket.on('disconnect', (reason) => {
            console.warn(`[${capitalizedType}Socket] Disconnected: ${reason}`);
        });

        socket.on('connect_error', (error) => {
            console.error(`[${capitalizedType}Socket] Connection error: ${error.message}`);
        });

        socket.on('token_invalid', async () => {
            console.log(`[${capitalizedType}Socket] Token expired, attempting to refresh...`);
            if (await apiClient.refreshAccessToken()) {
                Object.keys(this._sockets).forEach(namespace => {
                    this._connectSocket(namespace);
                });
            } else {
                console.error(`[${capitalizedType}Socket] Token refresh failed, disconnecting...`);
                socket.disconnect();
            }
        });

        socket.on('unauthorized', (error) => {
            console.error(`[${capitalizedType}Socket] Unauthorized: ${error.message}`);
        });
    }

    /**
     * Disconnect all sockets
     */
    disconnectAll() {
        Object.keys(this._sockets).forEach(type => {
            if (this._sockets[type]) {
                this._sockets[type].disconnect();
                this._sockets[type] = null;
            }
        });
    }
}

export const socketService = SocketService.getInstance();