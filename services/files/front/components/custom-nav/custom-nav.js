import {ImageButton} from "../image-button/image-button.js";
import {ListenerComponent} from "../component/listener-component.js";
import {gameService, GameStatus} from "../../services/game-service.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";
import {NOTIFICATIONS_EVENTS, notificationService} from "../../services/notifications-service.js";

export class CustomNav extends ListenerComponent {
    static HIDE_IN_GAME = ["leaderboard", "friends"];
    static HIDE_NOT_CONNECTED = ["friends", "chat", "notifications"];

    constructor() {
        super();

        ImageButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.addAutomaticEventListener(gameService, GameStatus.STARTED, () => this._hideElementsInGame());
        this.addAutomaticEventListener(userService, USER_EVENTS.CONNECTION, () => this._showElementOnConnection());
        this.addAutomaticEventListener(gameService, GameStatus.LEAVED, () => this._showElementsAfterGame());
        this.addAutomaticEventListener(notificationService, NOTIFICATIONS_EVENTS.NOTIFICATIONS_UPDATED, () => this._numberNotRead());
        this.addAutomaticEventListener(notificationService, NOTIFICATIONS_EVENTS.NOTIFICATIONS_DELETED, () => this._numberNotRead());

        if (!userService.isConnected())
            CustomNav.HIDE_NOT_CONNECTED.forEach(id => this.shadowRoot.getElementById(id).style.display = "none");

        const navButtons = this.shadowRoot.querySelectorAll(".nav-button");
        navButtons.forEach(button => {
            this.addAutoCleanListener(
                button,
                "click",
                () => this._handleNavClick(button, navButtons));
        });

        this.addAutoCleanListener(window, "drawerClosed", () => {
            navButtons.forEach(btn => btn.classList.remove("active"));
        });
    }

    _handleNavClick(button, navButtons) {
        const navValue = button.getAttribute("id");

        if (!navValue)
            return;

        if (button.classList.contains("active"))
            button.classList.remove("active");
        else {
            navButtons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");
        }

        window.dispatchEvent(
            new CustomEvent("openDrawer", {
                bubbles: true,
                composed: true,
                detail: {type: navValue}
            })
        );
    }

    _hideElementsInGame() {
        CustomNav.HIDE_IN_GAME.forEach(element => {
            this.shadowRoot.getElementById(element).style.display = "none";
        });
    }

    _showElementsAfterGame() {
        CustomNav.HIDE_IN_GAME.forEach(element => {
            this.shadowRoot.getElementById(element).style.display = "flex";
        });
    }

    _showElementOnConnection() {
        CustomNav.HIDE_NOT_CONNECTED.forEach(id => {
            this.shadowRoot.getElementById(id).style.display = "flex";
        });
    }

    _numberNotRead() {
        const button = this.shadowRoot.getElementById("notifications");
        if (button) {
            const numberNotRead = this.shadowRoot.getElementById("numberNotRead");
            if (numberNotRead) {
                numberNotRead.classList.add("bounce-animation");

                numberNotRead.addEventListener("animationend", function () {
                    numberNotRead.classList.remove("bounce-animation");
                });
                const nbNotifications = Array.from(notificationService.getNotifications())
                    .filter(([_, notification]) => !notification.isRead)
                    .length
                if (nbNotifications === 0)
                    numberNotRead.style.display = "none";
                else
                    numberNotRead.style.display = "block";
                numberNotRead.textContent = nbNotifications;
            }
        }
    }
}