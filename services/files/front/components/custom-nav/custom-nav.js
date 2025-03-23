import {ImageButton} from "../image-button/image-button.js";
import {ListenerComponent} from "../component/listener-component.js";
import {gameService, GameStatus} from "../../services/game-service.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";

export class CustomNav extends ListenerComponent {
    static HIDE_IN_GAME = ["leaderboard"];

    constructor() {
        super();

        ImageButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.showOnConnection();
        this.addEventListener(userService, USER_EVENTS.CONNECTION, () => this.showOnConnection());
        this.addEventListener(gameService, GameStatus.STARTED, () => this.hideElementsInGame());

        this.shadowRoot.querySelectorAll(".nav-button").forEach(button => {
            this.addAutoCleanListener(
                button,
                "click",
                () => {
                    const imageButton = button.querySelector("image-button");
                    if (!imageButton)
                        return;

                    window.dispatchEvent(
                        new CustomEvent("openDrawer", {
                            bubbles: true,
                            composed: true,
                            detail: {type: imageButton.id}
                        })
                    );
                }
            );
        });
    }

    showOnConnection() {
        const buttons = this.shadowRoot.querySelectorAll(".hidden-disconnected");

        buttons.forEach(button =>
            button.classList.toggle("hidden", !userService.isConnected())
        );
    }

    hideElementsInGame() {
        CustomNav.HIDE_IN_GAME.forEach(element => {
            this.shadowRoot.getElementById(element).style.display = "none";
        });
    }
}