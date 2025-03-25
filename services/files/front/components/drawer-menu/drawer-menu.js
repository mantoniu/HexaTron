import {LoginPortal} from "../login-portal/login-portal.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";
import {UserProfile} from "../user-profile/user-profile.js";
import {RegisterPortal} from "../register-portal/register-portal.js";
import {ForgottenPasswordPortal} from "../forgotten-password-portal/forgotten-password-portal.js";
import {SettingsPortal} from "../settings-portal/settings-portal.js";
import {LeaderboardPortal} from "../leaderboard-portal/leaderboard-portal.js";
import {ChatPortal} from "../chat-portal/chat-portal.js";
import {FriendsPortal} from "../friends-portal/friends-portal.js";
import {ListenerComponent} from "../component/listener-component.js";
import {CHAT_EVENTS, chatService} from "../../services/chat-service.js";

export const DRAWER_CONTENT = Object.freeze({
    PROFILE: "profile",
    REGISTER: "register",
    FORGOT_PASSWORD: "forgottenPassword",
    SETTINGS: "settings",
    LEADERBOARD: "leaderboard",
    FRIENDS: "friends",
    CHAT: "chat",
    VOID: ""
});

export class DrawerMenu extends ListenerComponent {
    constructor() {
        super();

        this.current = "";
        this.previous = "";
        this._oppened = false;
        LoginPortal.register();
        UserProfile.register();
        RegisterPortal.register();
        ForgottenPasswordPortal.register();
        LeaderboardPortal.register();
        SettingsPortal.register();
        ChatPortal.register();
        FriendsPortal.register();
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._content = this.shadowRoot.getElementById("content");

        this.addAutoCleanListener(window, "openDrawer", (event) => {
            this.previous = event.detail.type;
            this.setInitialState(this.previous);
        });

        this.addAutoCleanListener(window, "changeContent", (event) => {
            this.loadContent(event.detail);
        });

        this.shadowRoot.getElementById("close-btn").onclick = () => this.nav(this.current);

        this.addAutoCleanListener(document, "click", (event) => {
            if (!(event.composedPath().some(element => element.localName === "drawer-menu" || element.localName === "custom-nav")) && this._oppened) {
                this.nav(this.current);
            }
        });

        this.addAutoCleanListener(this, "showUserProfile", (event) => {
            event.stopPropagation();
            this.previous = this.current;
            if (event.detail.player._id === userService.user._id) {
                this.current = DRAWER_CONTENT.PROFILE;
                this.loadContent(DRAWER_CONTENT.PROFILE);
            } else {
                this.current = DRAWER_CONTENT.VOID;
                this._content.innerHTML = `<user-profile user='${JSON.stringify(event.detail.player)}' editable='false' part='user-friend-part'></user-profile>`;
                this.replaceCloseWithBack();
            }
        });

        this.addAutomaticEventListener(chatService, CHAT_EVENTS.CONVERSATION_CREATED, async (conversationId, open) => {
            if (open) {
                this.setInitialState(DRAWER_CONTENT.CHAT);
                this.shadowRoot.querySelector("chat-portal").whenConnected.then(async () => {
                    await this.shadowRoot.querySelector("chat-portal")._changeToggleSelected("friends");
                    await this.shadowRoot.querySelector("chat-portal")._openFriendList();
                    this.shadowRoot.querySelector("chat-portal")._openChatBox(await chatService.getConversation(conversationId));
                });
            }
        });

        this.addAutomaticEventListener(userService, USER_EVENTS.UPDATE_FRIEND, (data) => this.modificationStatus(data));
        this.addAutomaticEventListener(userService, USER_EVENTS.DELETE_FRIEND, (data) => this.modificationStatus(data));
    }

    loadContent(type) {
        let component;

        switch (type) {
            case DRAWER_CONTENT.PROFILE:
                component = (userService.isConnected())
                    ? `<user-profile user='${JSON.stringify(userService.user)}' editable='true' part='user-password-part'></user-profile>`
                    : "<login-portal></login-portal>";
                break;
            case DRAWER_CONTENT.REGISTER:
                component = "<register-portal></register-portal>";
                break;
            case DRAWER_CONTENT.FORGOT_PASSWORD:
                component = "<forgotten-password-portal></forgotten-password-portal>";
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
            default:
                console.warn("This type is not yet supported");
                return false;
        }
        this._content.innerHTML = component;
        return true;
    }

    nav(type) {
        const sidenav = this.shadowRoot.getElementById("mySidenav");
        const closeBtn = this.shadowRoot.getElementById("close-btn");

        if (this._oppened && this.current === type) {
            closeBtn.style.visibility = "hidden";
            sidenav.classList.remove("open");
            this.shadowRoot.getElementById("content").innerHTML = "";
            this._oppened = !this._oppened;

        } else {
            closeBtn.style.visibility = "visible";
            sidenav.classList.add("open");
            this._oppened = true;
        }
        this.current = type;
    }

    setInitialState(type) {
        this.shadowRoot.getElementById("close-btn").innerHTML = `&times;`;
        this.shadowRoot.getElementById("close-btn").onclick = () => this.nav(this.current);
        if (this.loadContent(type)) {
            this.nav(type);
        }
    }

    replaceCloseWithBack() {
        this.shadowRoot.getElementById("close-btn").innerHTML = `&larr;`;
        this.shadowRoot.getElementById("close-btn").onclick = () => {
            this.setInitialState(this.previous);
        };
    }

    modificationStatus(data) {
        const element = this._content.querySelector("user-profile");
        if (element && element.user._id === data.id) {
            if (data.deleted) {
                this.loadContent(this.previous);
                this.setInitialState();
            } else {
                let user = data.friendData;
                user._id = data.id;
                element.setAttribute("user", JSON.stringify(user));
            }
        }
    }
}