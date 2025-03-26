import {Component} from "../component/component.js";
import {LoginPortal} from "../login-portal/login-portal.js";
import {userService} from "../../services/user-service.js";
import {UserProfile} from "../user-profile/user-profile.js";
import {RegisterPortal} from "../register-portal/register-portal.js";
import {ForgottenPasswordPortal} from "../forgotten-password-portal/forgotten-password-portal.js";
import {SettingsPortal} from "../settings-portal/settings-portal.js";
import {LeaderboardPortal} from "../leaderboard-portal/leaderboard-portal.js";
import {ChatPortal} from "../chat-portal/chat-portal.js";
import {createAlertMessage} from "../../js/utils.js";

export const DRAWER_CONTENT = Object.freeze({
    PROFILE: "profile",
    REGISTER: "register",
    FORGOT_PASSWORD: "forgottenPassword",
    SETTINGS: "settings",
    LEADERBOARD: "leaderboard",
    CHAT: "chat"
});

export class DrawerMenu extends Component {
    constructor() {
        super();

        this.previous = "";
        this._oppened = false;
        LoginPortal.register();
        UserProfile.register();
        RegisterPortal.register();
        ForgottenPasswordPortal.register();
        LeaderboardPortal.register();
        SettingsPortal.register();
        ChatPortal.register();
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._content = this.shadowRoot.getElementById("content");
        this._closeBtn = this.shadowRoot.getElementById("close-btn");
        this._drawer = this.shadowRoot.getElementById("drawer");

        this.addAutoCleanListener(window, "openDrawer", (event) => {
            if (this.loadContent(event.detail.type))
                this.nav(event.detail.type);
        });

        this.addAutoCleanListener(window, "changeContent", (event) => {
            this.loadContent(event.detail);
        });

        this.addAutoCleanListener(
            this.shadowRoot.getElementById("close-btn"),
            "click",
            () => this.nav(this.previous)
        );

        const returnDiv = this.shadowRoot.getElementById("return");
        this.addAutoCleanListener(returnDiv, "click", () => {
            this._alertMessage?.remove();
            this.nav(this.previous);
        });

        this.addAutoCleanListener(this, "showUserProfile", (event) => {
            event.stopPropagation();
            this.previous = DRAWER_CONTENT.PROFILE;
            this.loadContent(DRAWER_CONTENT.PROFILE);
        });

        this._drawer.addEventListener("scroll", () => {
            this._closeBtn.classList.toggle("scrolled", this._drawer.scrollTop > 0);
        });

        this._content.addEventListener("createAlert", (event) => {
            const {type, text} = event.detail;
            this._alertMessage = createAlertMessage(this.shadowRoot.getElementById("alert-container"), type, text);
        });
    }

    loadContent(type) {
        let component;
        this._content.classList.remove('animate');
        this._alertMessage?.remove();

        switch (type) {
            case DRAWER_CONTENT.PROFILE:
                component = (userService.isConnected())
                    ? `<user-profile user='${JSON.stringify(userService.user)}' part='account-information'></user-profile>`
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

    nav(type) {
        if (this._oppened && this.previous === type) {
            this._closeBtn.style.visibility = "hidden";
            this.classList.remove("open");
            this._content.innerHTML = "";
            this._oppened = !this._oppened;
        } else {
            this._closeBtn.style.visibility = "visible";
            this.classList.add("open");
            this._oppened = true;
        }
        this.previous = type;
    }
}