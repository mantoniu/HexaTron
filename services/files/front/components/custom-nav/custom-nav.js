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

        this.addAutomaticEventListener(gameService, GameStatus.STARTED, () => this.hideElementsInGame());
        this.addAutomaticEventListener(gameService, GameStatus.LEAVED, () => this.showElementsAfterGame());
        this.addAutomaticEventListener(userService, USER_EVENTS.CONNECTION, () => this.showElementOnConnection());

        if (!userService.isConnected()) {
            CustomNav.HIDE_NOT_CONNECTED.forEach(id => this.shadowRoot.getElementById(id).style.display = "none");
        }

        this.shadowRoot.querySelectorAll("image-button").forEach(button => {
            this.addAutoCleanListener(
                button,
                "click",
                () => {
                    window.dispatchEvent(
                        new CustomEvent("openDrawer", {
                            bubbles: true,
                            composed: true,
                            detail: {type: button.id}
                        })
                    );
                }
            );
        });
    }

    hideElementsInGame() {
        CustomNav.HIDE_IN_GAME.forEach(element => {
            this.shadowRoot.getElementById(element).style.display = "none";
        });
    }

    showElementsAfterGame() {
        CustomNav.HIDE_IN_GAME.forEach(element => {
            this.shadowRoot.getElementById(element).style.display = "block";
        });
    }

    showElementOnConnection() {
        CustomNav.HIDE_NOT_CONNECTED.forEach(id => {
            this.shadowRoot.getElementById(id).style.display = "block"
        });
    }
}