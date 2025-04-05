import {Component} from "../component/component.js";
import {NotificationsListElement} from "../notifications-list-element/notifications-list-element.js";

export class NotificationsList extends Component {
    constructor() {
        super();

        NotificationsListElement.register();

        this.notificationsMap = new Map();
    }

    setNotificationsMap(notificationsMap) {
        this.notificationsMap = notificationsMap;
        this.setupList();
    }

    addNotification(notification) {
        this.notificationsMap[notification._id] = notification;
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupList();
    }

    setupList() {
        if (this.isConnected) {
            this.emptyNotificationMap();
            this.notificationsMap.forEach((notification, id) => {
                const notificationElement = this.shadowRoot.getElementById(id);
                if (notificationElement)
                    notificationElement.setNotification(notification);
                else {
                    const notificationElement = document.createElement("notifications-list-element");
                    notificationElement.setNotification(notification);
                    notificationElement.id = id;
                    this.shadowRoot.prepend(notificationElement);
                }

            });
        }
    }

    delete(notificationId) {
        this.notificationsMap.delete(notificationId);
        if (this.shadowRoot.getElementById(notificationId))
            this.shadowRoot.removeChild(this.shadowRoot.getElementById(notificationId));
        this.emptyNotificationMap();
    }

    emptyNotificationMap() {
        if (this.notificationsMap.size === 0) {
            const emptyText = document.createElement("p");
            emptyText.textContent = "No notifications at the moment";
            emptyText.id = "empty";
            this.shadowRoot.appendChild(emptyText);
        } else {
            const emptyText = this.shadowRoot.getElementById("empty");
            if (emptyText)
                this.shadowRoot.removeChild(emptyText);
        }
    }
}