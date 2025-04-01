import {socketService} from "./socket-service.js";
import {USER_EVENTS, userService} from "./user-service.js";

class NotificationsService {

    constructor() {
        if (NotificationsService._instance)
            return NotificationsService._instance;

        this._apiUrl = "api/notifications";
        NotificationsService._instance = this;
    }

    /**
     * Gets the socket connection for the user.
     *
     * @returns {Socket} The socket instance.
     */
    get socket() {
        return this._socket;
    }

    /**
     * Set the socket connection for the user.SSS
     *
     * @param socket - Socket value to set
     */
    set socket(socket) {
        this._socket = socket;
    }

    /**
     * Retrieves the singleton instance of NotificationsService.
     *
     * @returns {NotificationsService} The singleton instance.
     */
    static getInstance() {
        if (!NotificationsService._instance)
            NotificationsService._instance = new NotificationsService();

        return NotificationsService._instance;
    }

    /**
     * Connect the socket to the notifications-service of the back-end
     */
    initSocket() {
        this._socket = socketService.connectNotificationsSocket();
    }

    /**
     * Initializes the notifications service.
     * If the user is already connected, it fetches their notifications.
     * Also sets up listeners for login and logout events.
     *
     * @async
     * @returns {Promise<void>} Resolves when the initialization is complete.
     */
    async init() {
        console.log("test");
        userService.on(USER_EVENTS.CONNECTION, () => {
            this.initSocket();
        });

        if (userService.isConnected()) {
            this.initSocket();
        }
    }
}

export const notificationService = NotificationsService.getInstance();
await notificationService.init();