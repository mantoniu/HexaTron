import {Component} from '../component/component.js';
import {CustomButton} from "../custom-button/custom-button.js";
import {GameService, GameStatus} from "../../services/game-service.js";

export class ModeSelector extends Component {
    constructor() {
        super();

        CustomButton.register();
        this._gameCreatedHandler = null;
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._gameCreatedHandler = () => this._handleGameCreated();

        GameService.getInstance().on(
            GameStatus.CREATED,
            this._gameCreatedHandler
        );

        const buttons = this.shadowRoot.querySelectorAll("custom-button");
        buttons.forEach(button => {
            const handler = () => {
                const gameType = Number(button.getAttribute("game-type"));
                GameService.getInstance().startGame(gameType, 9, 16, 3, 2);
            };

            this.addAutoCleanListener(button, 'click', handler);
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this._gameCreatedHandler) {
            GameService.getInstance().off(
                GameStatus.CREATED,
                this._gameCreatedHandler
            );
        }
    }

    _handleGameCreated() {
        window.dispatchEvent(new CustomEvent("navigate", {
            detail: {route: "/game"}
        }));
    }
}