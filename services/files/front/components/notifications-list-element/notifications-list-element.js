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

        switch (this.notification.type) {
            case NOTIFICATIONS_TYPE.FRIEND_ACCEPT:
                message.textContent = `${this.notification.friendName} accepted your friend request`;
                button.textContent = `Check your friends`;
                this.addAutoCleanListener(button, "click", () => this.goToFriendsPortal());
                this.classList.add("friend");
                break;
            case NOTIFICATIONS_TYPE.FRIEND_DELETION:
                message.textContent = `${this.notification.friendName} has removed you from their friend list`;
                this.classList.add("button_hidden");
                this.classList.add("friend");
                break;
            case NOTIFICATIONS_TYPE.FRIEND_REQUEST:
                message.textContent = `${this.notification.friendName} wants to become your friend`;
                button.textContent = `Manage your friends`;
                this.addAutoCleanListener(button, "click", () => this.goToFriendsPortal());
                this.classList.add("friend");
                break;
            case NOTIFICATIONS_TYPE.FRIENDLY_GAME:
                message.textContent = "Friendly game";
                button.textContent = `Play`;
                break;
            case NOTIFICATIONS_TYPE.NEW_MESSAGE:
                //this.notification.objectsId => [conversationId, messageId]
                message.textContent = `${this.notification.friendName} sent you a message`;
                button.textContent = `Open the chat`;
                this.addAutoCleanListener(button, "click", () => this.openChatWithFriend());
                this.classList.add("message");
                break;
            default:
                console.warn("Type of notification unknown");
        }

        if (!this.notification.isRead) {
            this.classList.remove("friend");
            this.classList.remove("message");
            this.classList.add("isNotRead");
        }
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