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
}