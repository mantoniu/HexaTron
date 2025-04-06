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
        const type = this.shadowRoot.getElementById("type");
        if (!this.notification || !message || !button || !type) {
            return;
        }

        switch (this.notification.type) {
            case NOTIFICATIONS_TYPE.FRIEND_ACCEPT:
                message.textContent = `${this.notification.friendName} accepted your friend request`;
                button.textContent = `Check your friends`;
                this.addAutoCleanListener(button, "click", () => this.goToFriendsPortal());
                this.classList.add("friend");
                type.textContent = "Friend";
                break;
            case NOTIFICATIONS_TYPE.FRIEND_DELETION:
                message.textContent = `${this.notification.friendName} has removed you from their friend list`;
                this.classList.add("button_hidden");
                this.classList.add("friend");
                type.textContent = "Friend";
                break;
            case NOTIFICATIONS_TYPE.FRIEND_REQUEST:
                message.textContent = `${this.notification.friendName} wants to become your friend`;
                button.textContent = `Manage your friends`;
                this.addAutoCleanListener(button, "click", () => this.goToFriendsPortal());
                this.classList.add("friend");
                type.textContent = "Friend";
                break;
            case NOTIFICATIONS_TYPE.NEW_MESSAGE:
                //this.notification.objectsId => [conversationId, messageId]
                message.textContent = `${this.notification.friendName} sent you a message`;
                button.textContent = `Open the chat`;
                this.addAutoCleanListener(button, "click", () => this.openChatWithFriend());
                this.classList.add("message");
                type.textContent = "Message";
                break;
            case NOTIFICATIONS_TYPE.GAME_INVITATION:
                message.textContent = `${this.notification.friendName} sent you a game invitation`;
                button.textContent = "Join the game";
                this.addAutoCleanListener(button, "click", () => this.joinGame());
                type.textContent = "Game Invitation";
                this.classList.add("game-invitation");
                break;
            default:
                console.warn("Type of notification unknown");
        }

        if (!this.notification.isRead) {
            this.classList.add("isNotRead");
        }
    }

    joinGame() {
        const gameId = this.notification?.objectsId?.[0];

        if (!gameId) {
            console.error("Game id not defined");
            return;
        }

        this.dispatchEvent(new CustomEvent("closeDrawer", {
            composed: true,
            bubbles: true
        }));

        window.dispatchEvent(new CustomEvent("navigate", {
            detail: {
                route: `/friendly`,
                params: {gameId: gameId}
            }
        }));
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