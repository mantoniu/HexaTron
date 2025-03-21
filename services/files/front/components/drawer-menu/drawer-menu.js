import {Component} from "../component/component.js";
import {LoginPortal} from "../login-portal/login-portal.js";
import {userService} from "../../services/user-service.js";
import {UserProfile} from "../user-profile/user-profile.js";
import {RegisterPortal} from "../register-portal/register-portal.js";
import {ForgottenPasswordPortal} from "../forgotten-password-portal/forgotten-password-portal.js";
import {SettingsPortal} from "../settings-portal/settings-portal.js";
import {LeaderboardPortal} from "../leaderboard-portal/leaderboard-portal.js";
import {FriendsPortal} from "../friends-portal/friends-portal.js";

export const DRAWER_CONTENT = Object.freeze({
    PROFILE: "profile",
    REGISTER: "register",
    FORGOT_PASSWORD: "forgottenPassword",
    SETTINGS: "settings",
    LEADERBOARD: "leaderboard",
    FRIENDS: "friends"
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
        FriendsPortal.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

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

        this.addAutoCleanListener(document, "click", (event) => {
            if (!(event.composedPath().some(element => element.localName === "drawer-menu" || element.localName === "custom-nav")) && this._oppened) {
                this.nav(this.previous);
            }
        });

        this.addAutoCleanListener(this, "showUserProfile", (event) => {
            event.stopPropagation();
            if (event.detail.name === userService.user.name) {
                this.previous = DRAWER_CONTENT.PROFILE;
                this.loadContent(DRAWER_CONTENT.PROFILE);
            } else {
                this.previous = DRAWER_CONTENT.FRIENDS;
                this.loadContent(DRAWER_CONTENT.FRIENDS);
                const newEvent = new CustomEvent("watchProfile", {
                    detail: {player: event.detail},
                    bubbles: true,
                    composed: true
                });
                this.shadowRoot.querySelector("friends-portal").dispatchEvent(newEvent);
            }
        });
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
            case DRAWER_CONTENT.FRIENDS:
                component = "<friends-portal></friends-portal>";
                break;
            default:
                console.warn("This type is not yet supported");
                return false;
        }

        this.shadowRoot.getElementById("content").innerHTML = component;
        return true;
    }

    nav(type) {
        const sidenav = this.shadowRoot.getElementById("mySidenav");
        const closeBtn = this.shadowRoot.getElementById("close-btn");

        if (this._oppened && this.previous === type) {
            closeBtn.style.visibility = "hidden";
            sidenav.classList.remove("open");
            this.shadowRoot.getElementById("content").innerHTML = "";
            this._oppened = !this._oppened;

        } else {
            closeBtn.style.visibility = "visible";
            sidenav.classList.add("open");
            this._oppened = true;
        }
        this.previous = type;
    }
}