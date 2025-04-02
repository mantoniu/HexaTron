import {socketService} from "./socket-service.js";
import {USER_EVENTS, userService} from "./user-service.js";
import {notificationStore} from "../js/NotificationsStore.js";
import {EventEmitter} from "../js/EventEmitter.js";

/**
 *  Defines the notifications events
 *
 * @constant {Object}
 */
export const NOTIFICATIONS_EVENTS = Object.freeze({
    NOTIFICATIONS_UPDATED: "NOTIFICATIONS_UPDATED",
    NOTIFICATIONS_ADDED: "NOTIFICATIONS_ADDED"
});

/**
 * Defines the type of notifications
 *
 * @constant {Object}
 */
export const NOTIFICATIONS_TYPE = Object.freeze({
    NEW_MESSAGE: "newMessage",
    FRIEND_REQUEST: "friendRequest",
    FRIEND_DELETION: "friendDeletion",
    FRIEND_ACCEPT: "friendAccept",
    FRIENDLY_GAME: "friendlyGame"
});

class NotificationsService extends EventEmitter {

    constructor() {
        super();
        if (NotificationsService._instance)
            return NotificationsService._instance;

        this._apiUrl = "api/notifications";
        NotificationsService._instance = this;
        this._notificationsStore = notificationStore;
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
        this._setupNotificationsSocketListeners();
    }

    /**
     * Retrieves the list of notifications from the NotificationsStore.
     *
     * @return {NotificationsStore._notifications} The notifications stored in the NotificationsStore.
     */
    getNotifications() {
        return this._notificationsStore.notifications;
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
        userService.on(USER_EVENTS.CONNECTION, () => {
            this.initSocket();
        });

        if (userService.isConnected()) {
            this.initSocket();
        }
    }

    /**
     * Set all the field isRead to true for all the notifications and send an event to the back-end
     */
    setAllRead() {
        this._notificationsStore.setAllRead();
        this._socket.emit("notificationsRead");
        this.emit(NOTIFICATIONS_EVENTS.NOTIFICATIONS_UPDATED);
    }

    /**
     * Sets up the socket event listeners for notification addition.
     *
     * This function listens for two socket events:
     * 1. **"new-notification"**: When a notification is sent to the user, the event handler add the notification to
     *    the notifications list in the NotificationsStore.
     * 2. **"notifications"**: When the user is connected receive the notification to update the notifications list in the NotificationsStore.
     */
    _setupNotificationsSocketListeners() {
        this.socket.on("connect", () => {
            if (!this._notificationsStore.fetch) {
                this.socket.emit("getNotifications");
            }
        });

        this.socket.on("getNotifications", (data) => {
            if (!this._notificationsStore.fetch) {
                this._notificationsStore.notifications = data.reduce((acc, notification) => {
                    acc.set(notification._id, notification);
                    return acc;
                }, new Map());
            }
            this.emit(NOTIFICATIONS_EVENTS.NOTIFICATIONS_UPDATED);
        });

        this.socket.on("new-notification", (data) => {
            this._notificationsStore.addNotification(data.notification);
            this.emit(NOTIFICATIONS_EVENTS.NOTIFICATIONS_UPDATED);
        });

        this.socket.on("disconnect", () => this._notificationsStore.clear());
    }
}

export const notificationService = NotificationsService.getInstance();
await notificationService.init();