import { Component } from "../component/component.js";
import { GameEngine, GameType } from "../../js/GameEngine.js";
import { resizeCanvas } from "../../js/Utils.js";

export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        resizeCanvas(this, 0.85, 0.80, "board");
        const canvas = this.shadowRoot.getElementById("board");
        const context = canvas.getContext("2d");
        this.gameEngine = new GameEngine(GameType.LOCAL, context);
    }
}