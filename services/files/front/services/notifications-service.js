import {socketService} from "./socket-service.js";
import {USER_EVENTS, userService} from "./user-service.js";
import {notificationStore} from "../js/NotificationsStore.js";
import {EventEmitter} from "../js/EventEmitter.js";
import {hapticNotification} from "../js/config.js";

/**
 *  Defines the notifications events
 *
 * @constant {Object}
 */
export const NOTIFICATIONS_EVENTS = Object.freeze({
    NOTIFICATIONS_UPDATED: "NOTIFICATIONS_UPDATED",
    NOTIFICATIONS_DELETED: "NOTIFICATIONS_DELETED",
    MENU_OPEN: "MENU_OPEN"
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
    GAME_INVITATION: "gameInvitation"
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

    deleteNotification(notificationId) {
        this._socket.emit("deleteNotifications", notificationId);
    }

    /**
     * Removes notifications related to friends (accept, request, and deletion).
     *
     * @function
     * @returns {void}
     */
    removeFriendsNotifications() {
        this._notificationsStore.notifications.forEach((notification, id) => {
            if ([NOTIFICATIONS_TYPE.FRIEND_ACCEPT, NOTIFICATIONS_TYPE.FRIEND_REQUEST, NOTIFICATIONS_TYPE.FRIEND_DELETION].includes(notification.type))
                this._socket.emit("deleteNotifications", id);
        });
    }

    /**
     * Removes notifications related to a specific conversation.
     *
     * @function
     * @param {string} conversationId - The ID of the conversation whose notifications need to be removed.
     * @returns {void}
     */
    removeConversationNotifications(conversationId) {
        this._notificationsStore.notifications.forEach((notification, id) => {
            if (notification.type === NOTIFICATIONS_TYPE.NEW_MESSAGE && notification.objectsId[0] === conversationId)
                this._socket.emit("deleteNotifications", id);
        });
    }

    /**
     * Emits an event indicating that the notifications have been updated.
     *
     * @function
     * @returns {void}
     */
    sendUpdateEvent() {
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
            hapticNotification().then(() => {
                this._notificationsStore.addNotification(data.notification);
                this.emit(NOTIFICATIONS_EVENTS.MENU_OPEN, data.notification);
            });
        });

        this.socket.on("deleteNotifications", (data) => {
            this._notificationsStore.deleteNotification(data);
            this.emit(NOTIFICATIONS_EVENTS.NOTIFICATIONS_DELETED, data);
        });

        this.socket.on("disconnect", () => this._notificationsStore.clear());
    }
}

export const notificationService = NotificationsService.getInstance();
await notificationService.init();