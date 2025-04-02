import {Component} from "../component/component.js";
import {UserFriendPart} from "../user-friend-part/user-friend-part.js";
import {NOTIFICATIONS_TYPE} from "../../services/notifications-service.js";

export class NotificationsListElement extends Component {
    constructor() {
        super();

        UserFriendPart.register();
        NotificationsListElement.register();

        this.notification = null;
    }

    setNotification(notification) {
        this.notification = notification;
        this.initialise();
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.initialise();

        this.addAutoCleanListener(this.shadowRoot.getElementById("delete-btn"), "click", () => {
            this.dispatchEvent(new CustomEvent("notification-deleted", {
                bubbles: true,
                composed: true,
                detail: {notificationId: this.getAttribute("id")}
            }));
        });
    }

    initialise() {
        const message = this.shadowRoot.getElementById("message");
        if (!this.notification || !message) {
            return;
        }

        switch (this.notification.type) {
            case NOTIFICATIONS_TYPE.FRIEND_ACCEPT:
                message.textContent = "Friend Accepted";
                break;
            case NOTIFICATIONS_TYPE.FRIEND_DELETION:
                message.textContent = "Friend deleted";
                break;

            case NOTIFICATIONS_TYPE.FRIEND_REQUEST:
                message.textContent = "Friend requested";
                break;
            case NOTIFICATIONS_TYPE.FRIENDLY_GAME:
                message.textContent = "Friendly game";
                break;
            case NOTIFICATIONS_TYPE.NEW_MESSAGE:
                message.textContent = "New message";
                break;
            default:
                console.warn("Type of notification unknown");
        }

        if (this.notification.isRead)
            this.classList.add("isRead");
    }
}