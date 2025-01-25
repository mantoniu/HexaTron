import { Component } from "../component/component.js";
import { GameEngine, GameType } from "../../js/GameEngine.js";
import { resizeCanvas } from "../../js/Utils.js";

export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        const canvas = this.shadowRoot.getElementById("board");
        const context = canvas.getContext("2d");
        this.gameEngine = new GameEngine(GameType.LOCAL, context);

        this.resizeCanvasFunction = resizeCanvas.bind(this, 0.85, 0.80, "board", this.gameEngine.draw, this.gameEngine);
        this.resizeCanvasFunction.call();

        window.addEventListener("resize", this.resizeCanvasFunction);

        const event = new CustomEvent("game-created", {
            bubbles: true,
            detail: { players: this.gameEngine._game.players }
        });

        this.dispatchEvent(event);
    }

    disconnectedCallback() {
        window.removeEventListener("resize", this.resizeCanvasFunction);
    }
}