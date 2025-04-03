import {Component} from "../component/component.js";
import {UserFriendPart} from "../user-friend-part/user-friend-part.js";
import {NOTIFICATIONS_TYPE} from "../../services/notifications-service.js";
import {DRAWER_CONTENT} from "../drawer-menu/drawer-menu.js";

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
        const button = this.shadowRoot.getElementById("action");
        if (!this.notification || !message || !button) {
            return;
        }

        console.log(this.notification);
        switch (this.notification.type) {
            case NOTIFICATIONS_TYPE.FRIEND_ACCEPT:
                message.textContent = `${this.notification.friendName} accepted your friend request`;
                button.textContent = `Check Out Your Friends`;
                this.addAutoCleanListener(button, "click", () => this.goToFriendsPortal());
                break;
            case NOTIFICATIONS_TYPE.FRIEND_DELETION:
                message.textContent = `${this.notification.friendName} deleted you from the friend list`;
                break;
            case NOTIFICATIONS_TYPE.FRIEND_REQUEST:
                message.textContent = `${this.notification.friendName} wants to become your friend`;
                button.textContent = `Manage Friends`;
                this.addAutoCleanListener(button, "click", () => this.goToFriendsPortal());
                break;
            case NOTIFICATIONS_TYPE.FRIENDLY_GAME:
                message.textContent = "Friendly game";
                button.textContent = `Play`;
                break;
            case NOTIFICATIONS_TYPE.NEW_MESSAGE:
                //this.notification.objectsId => [conversationId, messageId]
                message.textContent = `${this.notification.friendName} deleted you from the friend list`;
                button.textContent = `Open the chat`;
                this.addAutoCleanListener(button, "click", () => this.openChatWithFriend());
                break;
            default:
                console.warn("Type of notification unknown");
        }

        if (this.notification.isRead)
            this.classList.add("isRead");
    }

    goToFriendsPortal() {
        this.dispatchEvent(new CustomEvent("changeContent", {
            bubbles: true,
            composed: true,
            detail: DRAWER_CONTENT.FRIENDS
        }));
    }

    openChatWithFriend() {
        this.dispatchEvent(new CustomEvent("openConversation", {
            bubbles: true,
            composed: true,
            detail: this.notification.objectsId[0]
        }));
    }
}