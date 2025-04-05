/**
 * NotificationStore is responsible for managing notifications data locally.
 * It serves as a temporary storage layer for notifications.
 */
class NotificationsStore {
    constructor() {
        this._notifications = new Map();
        this._fetch = false;
    }

    /**
     * Get the list of notifications stored in the store.
     *
     * @returns {Map} A Map of notifications, where the key is the notification ID and the value is the notification object.
     */
    get notifications() {
        return this._notifications;
    }

    /**
     * Set notifications in the store and mark it as fetched.
     *
     * @param {Map} notifications - A Map where the key is the notification ID and the value is the notification object.
     */
    set notifications(notifications) {
        this._notifications = notifications;
        this._fetch = true;
    }

    /**
     * Get the fetch status indicating if the notifications have been fetched.
     *
     * @returns {boolean} True if notifications have been fetched, false otherwise.
     */
    get fetch() {
        return this._fetch;
    }

    /**
     * Add a new notification to the store.
     *
     * @param {Object} notification - The notification object to add.
     */
    addNotification(notification) {
        this.notifications.set(notification._id, notification);
    }

    /**
     * Delete a notification from the store by its ID.
     *
     * @param {string} notificationId - The ID of the notification to delete.
     */
    deleteNotification(notificationId) {
        this._notifications.delete(notificationId);
    }

    /**
     * Clear all notifications from the store and reset fetch status.
     */
    clear() {
        this._notifications.clear();
        this._fetch = false;
    }

    /**
     * Mark all notifications in the store as read.
     */
    setAllRead() {
        this._notifications.forEach(notification => notification.isRead = true);
    }
}

export const notificationStore = new NotificationsStore();