import {ImageButton} from "../image-button/image-button.js";
import {ListenerComponent} from "../component/listener-component.js";
import {gameService, GameStatus} from "../../services/game-service.js";


export class CustomNav extends ListenerComponent {
    static HIDE_IN_GAME = ["leaderboard"];

    constructor() {
        super();

        ImageButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.addEventListener(gameService, GameStatus.STARTED, () => this.hideElementsInGame());

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
}