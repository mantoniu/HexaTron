import {LoginPortal} from "../login-portal/login-portal.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";
import {UserProfile} from "../user-profile/user-profile.js";
import {RegisterPortal} from "../register-portal/register-portal.js";
import {ForgottenPasswordPortal} from "../forgotten-password-portal/forgotten-password-portal.js";
import {SettingsPortal} from "../settings-portal/settings-portal.js";
import {LeaderboardPortal} from "../leaderboard-portal/leaderboard-portal.js";
import {ChatPortal} from "../chat-portal/chat-portal.js";
import {createAlertMessage} from "../../js/utils.js";
import {FriendsPortal} from "../friends-portal/friends-portal.js";
import {ListenerComponent} from "../component/listener-component.js";
import {CHAT_EVENTS, chatService} from "../../services/chat-service.js";
import {NotificationsPortal} from "../notifications-portal/notifications-portal.js";
import {NOTIFICATIONS_EVENTS, NOTIFICATIONS_TYPE, notificationService} from "../../services/notifications-service.js";

export const DRAWER_CONTENT = Object.freeze({
    PROFILE: "profile",
    REGISTER: "register",
    FORGOT_PASSWORD: "forgottenPassword",
    SETTINGS: "settings",
    LEADERBOARD: "leaderboard",
    FRIENDS: "friends",
    CHAT: "chat",
    NOTIFICATIONS: "notifications",
    VOID: ""
});

export class DrawerMenu extends ListenerComponent {
    constructor() {
        super();

        this.current = "";
        this.previous = "";
        this._opened = false;
        LoginPortal.register();
        UserProfile.register();
        RegisterPortal.register();
        ForgottenPasswordPortal.register();
        LeaderboardPortal.register();
        SettingsPortal.register();
        ChatPortal.register();
        FriendsPortal.register();
        NotificationsPortal.register();
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._content = this.shadowRoot.getElementById("content");
        this._closeBtn = this.shadowRoot.getElementById("close-btn");
        this._drawer = this.shadowRoot.getElementById("drawer");
        this._setInitialState();
        this._setupListeners();
    }

    _setupUserServiceListeners() {
        this.addAutomaticEventListener(userService,
            USER_EVENTS.UPDATE_FRIEND,
            (data) => this._modificationStatus(data));

        this.addAutomaticEventListener(userService,
            USER_EVENTS.REMOVE_FRIEND,
            (data) => this._modificationStatus(data, false));

        this.addAutomaticEventListener(userService,
            USER_EVENTS.DELETE_USER,
            (data) => this._modificationStatus(data, true));
    }

    _setupChatServiceListeners() {
        this.addAutomaticEventListener(chatService, CHAT_EVENTS.CONVERSATION_CREATED, async (conversationId, open) => {
            if (open) {
                this._setInitialState(DRAWER_CONTENT.CHAT);
                const chatPortal = this.shadowRoot.querySelector("chat-portal");
                chatPortal.whenConnected.then(async () => {
                    await chatPortal.changeToggleSelected("friends");
                    await chatPortal.openFriendList();
                    chatPortal._openChatBox(await chatService.getConversation(conversationId));
                });
            }
        });
    }

    _setupNotificationServiceListeners() {
        this.addAutomaticEventListener(notificationService, NOTIFICATIONS_EVENTS.MENU_OPEN, (notification) => {
            switch (this.current) {
                case DRAWER_CONTENT.CHAT:
                    const chatPortal = this.shadowRoot.querySelector("chat-portal");
                    if (chatPortal && notification.objectsId === chatPortal.getActualConversationId())
                        notificationService.removeConversationNotifications(notification.objectsId);
                    else
                        notificationService.sendUpdateEvent();
                    break;
                case DRAWER_CONTENT.FRIENDS:
                    if (!NOTIFICATIONS_TYPE.NEW_MESSAGE && !NOTIFICATIONS_TYPE.GAME_INVITATION)
                        notificationService.removeFriendsNotifications();
                    else
                        notificationService.sendUpdateEvent();
                    break;
                default:
                    notificationService.sendUpdateEvent();
            }
        });
    }

    _setupListeners() {
        this.addAutoCleanListener(window, "openDrawer", (event) => {
            this.previous = event.detail.type;
            this._setInitialState(this.previous);
        });

        this.addAutoCleanListener(window, "changeContent", (event) => {
            if (this._loadContent(event.detail) && this.current !== event.detail) {
                this._nav(event.detail);
            }
        });

        const returnDiv = this.shadowRoot.getElementById("return");
        this.addAutoCleanListener(returnDiv, "click", () => {
            this.dispatchEvent(new CustomEvent("drawerChanged", {
                bubbles: true,
                composed: true
            }));
            this._alertMessage?.remove();
            this._nav(this.current);
        });

        this.addAutoCleanListener(this, "showUserProfile", (event) => {
            event.stopPropagation();
            this.previous = this.current;
            const isCurrentUser = event.detail.player._id === userService.user._id;
            this.dispatchEvent(new CustomEvent("drawerChanged", {
                bubbles: true,
                composed: true,
                detail: isCurrentUser ? DRAWER_CONTENT.PROFILE : null
            }));

            if (isCurrentUser) {
                this.current = DRAWER_CONTENT.PROFILE;
                this._loadContent(DRAWER_CONTENT.PROFILE);
            } else {
                this.current = DRAWER_CONTENT.VOID;
                this.current = DRAWER_CONTENT.PROFILE;
                this._content.innerHTML = `<user-profile 
                                   user='${JSON.stringify(event.detail.player)}'>
                               </user-profile>`;
                this._replaceCloseWithBack();
            }
        });

        this.addAutoCleanListener(this, "openConversation", async (conversationId) => {
            this._setInitialState(DRAWER_CONTENT.CHAT);
            const chatPortal = this.shadowRoot.querySelector("chat-portal");
            chatPortal.whenConnected.then(async () => {
                await chatPortal.changeToggleSelected("friends");
                await chatPortal.openFriendList();
                chatPortal._openChatBox(await chatService.getConversation(conversationId.detail));
                notificationService.removeConversationNotifications(conversationId.detail);
            });
        });

        this._drawer.addEventListener("scroll", () => {
            this._closeBtn.classList.toggle("scrolled", this._drawer.scrollTop > 0);
        });

        this._content.addEventListener("createAlert", (event) => {
            const {type, text} = event.detail;
            const alertContainer = this.shadowRoot.getElementById("alert-container");
            this._alertMessage = createAlertMessage(alertContainer, type, text);
        });

        this.addEventListener("closeDrawer", (event) => {
            event.stopPropagation();
            this._nav(this.current);
        });

        this._setupChatServiceListeners();
        this._setupUserServiceListeners();
        this._setupNotificationServiceListeners();
    }

    _loadContent(type) {
        let component;
        this._content.classList.remove('animate');
        this._alertMessage?.remove();

        switch (type) {
            case DRAWER_CONTENT.PROFILE:
                component = (userService.isConnected())
                    ? `<user-profile></user-profile>`
                    : "<login-portal></login-portal>";
                break;
            case DRAWER_CONTENT.REGISTER:
                component = "<register-portal></register-portal>";
                this._replaceCloseWithBack();
                break;
            case DRAWER_CONTENT.FORGOT_PASSWORD:
                component = "<forgotten-password-portal></forgotten-password-portal>";
                this._replaceCloseWithBack();
                break;
            case DRAWER_CONTENT.SETTINGS:
                component = "<settings-portal></settings-portal>";
                break;
            case DRAWER_CONTENT.LEADERBOARD:
                component = "<leaderboard-portal></leaderboard-portal>";
                break;
            case DRAWER_CONTENT.CHAT:
                component = "<chat-portal></chat-portal>";
                break;
            case DRAWER_CONTENT.FRIENDS:
                component = "<friends-portal></friends-portal>";
                break;
            case DRAWER_CONTENT.NOTIFICATIONS:
                component = "<notifications-portal></notifications-portal>";
                break;
            default:
                console.warn("This type is not yet supported");
                return false;
        }

        this._content.innerHTML = component;
        setTimeout(() => {
            this._content.classList.add('animate');
        }, 50);

        return true;
    }

    _nav(type) {
        if (this._opened && this.current === "notifications") {
            notificationService.setAllRead();
        }
        if (this._opened && this.current === type) {
            this._closeBtn.style.visibility = "hidden";
            this.classList.remove("open");
            this._content.innerHTML = "";
            this._opened = !this._opened;
            this.dispatchEvent(new CustomEvent("drawerChanged", {
                bubbles: true,
                composed: true
            }));
        } else {
            this._closeBtn.style.visibility = "visible";
            this.classList.add("open");
            this._opened = true;
        }
        this.current = type;
    }

    _setInitialState(type) {
        this._closeBtn.innerHTML = `&times;`;
        this._closeBtn.onclick = () => {
            this.dispatchEvent(new CustomEvent("drawerChanged", {
                bubbles: true,
                composed: true
            }));
            this._nav(this.current);
        };
        if (type && this._loadContent(type))
            this._nav(type);
    }

    _replaceCloseWithBack() {
        this._closeBtn.innerHTML = `&larr;`;
        this._closeBtn.onclick = () => {
            this.dispatchEvent(new CustomEvent("drawerChanged", {
                bubbles: true,
                composed: true,
                detail: this.previous
            }));
            this._setInitialState(this.previous);
        }
    }

    _modificationStatus(data, deleted) {
        const element = this._content.querySelector("user-profile");
        if (element && element.user._id === data.id) {
            if (deleted) {
                this._setInitialState(this.previous);
            } else {
                let user = data.friendData;
                user._id = data.id;
                element.setAttribute("user", JSON.stringify(user));
            }
        }
    }
}