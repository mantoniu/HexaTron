import { Component } from "../component/component.js";
import { GameEngine, GameType } from "../../js/GameEngine.js";
import { resizeCanvas } from "../../js/Utils.js";

export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        resizeCanvas(this, 0.85, 0.80, "board", null, null);
        const canvas = this.shadowRoot.getElementById("board");
        const context = canvas.getContext("2d");
        this.gameEngine = new GameEngine(GameType.LOCAL, context);
        window.addEventListener("resize", resizeCanvas.bind(this, this, 0.85, 0.80, "board", this.gameEngine.redraw, this.gameEngine));
    }

    disconnectedCallback() {
        window.removeEventListener("resize", resizeCanvas.bind(this, this, 0.85, 0.80, "board", this.gameEngine.redraw, this.gameEngine));
    }
}