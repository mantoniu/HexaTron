import {NotificationsList} from "../notifications-list/notifications-list.js";
import {ListenerComponent} from "../component/listener-component.js";
import {NOTIFICATIONS_EVENTS, notificationService} from "../../services/notifications-service.js";

export class NotificationsPortal extends ListenerComponent {
    constructor() {
        super();
        NotificationsList.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.addAutomaticEventListener(notificationService, NOTIFICATIONS_EVENTS.NOTIFICATIONS_UPDATED, () => this.shadowRoot.getElementById("list").setNotificationsMap(notificationService.getNotifications()));
        this.addAutomaticEventListener(notificationService, NOTIFICATIONS_EVENTS.NOTIFICATIONS_DELETED, (notificationId) => {
            this.shadowRoot.getElementById("list").delete(notificationId);
        });
        this.addAutoCleanListener(this, "notification-deleted", (event) => this._handleDeletion(event));
        this.initialize();
    }

    initialize() {
        const notificationList = this.shadowRoot.getElementById("list");
        if (notificationList) {
            notificationList.setNotificationsMap(notificationService.getNotifications());
        }
    }

    _handleDeletion(event) {
        event.stopPropagation();
        notificationService.deleteNotification(event.detail.notificationId);
    }
}