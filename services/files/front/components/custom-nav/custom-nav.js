import {ImageButton} from "../image-button/image-button.js";
import {ListenerComponent} from "../component/listener-component.js";
import {gameService, GameStatus} from "../../services/game-service.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";

export class CustomNav extends ListenerComponent {
    static HIDE_IN_GAME = ["leaderboard", "friends"];
    static HIDE_NOT_CONNECTED = ["friends", "chat"];

    constructor() {
        super();

        ImageButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.addAutomaticEventListener(gameService, GameStatus.STARTED, () => this._hideElementsInGame());
        this.addAutomaticEventListener(userService, USER_EVENTS.CONNECTION, () => this._showElementOnConnection());
        this.addAutomaticEventListener(gameService, GameStatus.LEAVED, () => this._showElementsAfterGame());

        if (!userService.isConnected())
            CustomNav.HIDE_NOT_CONNECTED.forEach(id => this.shadowRoot.getElementById(id).style.display = "none");

        const navButtons = this.shadowRoot.querySelectorAll(".nav-button");
        navButtons.forEach(button => {
            this.addAutoCleanListener(
                button,
                "click",
                () => this._handleNavClick(button, navButtons));
        });

        this.addAutoCleanListener(window, "drawerChanged", (event) => {
            navButtons.forEach(btn => btn.classList.remove("active"));
            if (event.detail)
                this.shadowRoot.getElementById(event.detail).classList.add("active");
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
}