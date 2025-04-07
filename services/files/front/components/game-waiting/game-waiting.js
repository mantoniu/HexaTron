import {Component} from "../component/component.js";
import {WaitingLoader} from "../waiting-loader/waiting-loader.js";
import {GameType} from "../../js/game/Game.js";

export class GameWaiting extends Component {
    constructor() {
        super();

        WaitingLoader.register();
    }

    static get observedAttributes() {
        return ["game-type", "friend-name"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._waitingText = this.shadowRoot.getElementById("waiting-text");
        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "game-type":
                const gameTypeNumber = Number(newValue);

                if (Object.values(GameType).includes(gameTypeNumber))
                    this._gameType = gameTypeNumber;
                else
                    console.warn("Invalid game type:", newValue);
                break;
            case "friend-name":
                this._friendName = newValue;
                break;
        }

        this._update();
    }

    _update() {
        if (!this._waitingText)
            return;

        let text = "Waiting for the game to launch";
        switch (this._gameType) {
            case GameType.RANKED:
                text = "Waiting for an opponent";
                break;
            case GameType.FRIENDLY:
                if (this._friendName)
                    text = `Waiting for ${this._friendName} to join`;
                break;
        }

        this._waitingText.textContent = text;
    }
}