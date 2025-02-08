import {Component} from '../component/component.js';
import {CustomButton} from "../custom-button/custom-button.js";
import {GameService, GameStatus} from "../../services/game-service.js";

export class ModeSelector extends Component {
    constructor() {
        super();

        CustomButton.register();
        this.gameCreationListener();
    }

    gameCreationListener() {
        GameService.getInstance().on(GameStatus.CREATED, () => {
            window.dispatchEvent(new CustomEvent("navigate", {detail: {route: "/game"}}));
        });
    }

    async connectedCallback() {
        await super.connectedCallback();

        setTimeout(() => {
            this.shadowRoot.querySelectorAll("custom-button").forEach(button => {
                button.addEventListener("click", () => {
                    const gameType = Number(button.getAttribute("game-type"));

                    GameService.getInstance().startGame(gameType, 9, 16, 3, 2);
                });
            });
        }, 0);
            this.addAutoCleanListener(button, 'click', handler);
    }
}