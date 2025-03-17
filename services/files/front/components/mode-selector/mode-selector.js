import {CustomButton} from "../custom-button/custom-button.js";
import {gameService} from "../../services/game-service.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";
import {GameType} from "../../js/game/Game.js";
import {ListenerComponent} from "../component/listener-component.js";

export class ModeSelector extends ListenerComponent {
    constructor() {
        super();

        CustomButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._rankedButton = this.shadowRoot.querySelector(`custom-button[game-type="${GameType.RANKED}"]`);

        const buttons = this.shadowRoot.querySelectorAll("custom-button");
        buttons.forEach(button => {
            const gameType = Number(button.getAttribute("game-type"));

            if (gameType === GameType.RANKED && !userService.isConnected())
                this.lockRankedButton();

            const handler = () => {
                gameService.startGame(gameType);

                setTimeout(() => {
                    window.dispatchEvent(new CustomEvent("navigate", {
                        detail: {route: "/game"}
                    }));
                }, 200);
            };

            this.addAutoCleanListener(button, 'click', handler);
        });

        this.addEventListener(userService, USER_EVENTS.CONNECTION, () => this.unLockRankedButton());
        this.addEventListener(userService, USER_EVENTS.LOGOUT, () => this.lockRankedButton());
    }

    lockRankedButton() {
        this._rankedButton.setAttribute("locked", "");
        this._rankedButton.setAttribute("tooltip-message", "You must be logged in to play Ranked mode.");
    }

    unLockRankedButton() {
        this._rankedButton.removeAttribute("locked");
        this._rankedButton.removeAttribute("tooltip-message");
    }
}