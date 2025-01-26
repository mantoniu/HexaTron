import { Component } from "../component/component.js";
import { GameEngine } from "../../js/GameEngine.js";
import { CURRENT_USER } from "../../js/UserMock.js";
import { GameType } from "../../js/Game.js";
import { resizeCanvas } from "../../js/Utils.js";


export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        const canvas = this.shadowRoot.getElementById("board");
        const context = canvas.getContext("2d");
        this.gameEngine = new GameEngine([CURRENT_USER], GameType.LOCAL, 9, 16, 3, 2, context, 200);

        this.resizeCanvasFunction = resizeCanvas.bind(this, 0.85, 0.80, "board", this.gameEngine.draw, this.gameEngine);
        this.resizeCanvasFunction.call();

        window.addEventListener("resize", this.resizeCanvasFunction);

        const event = new CustomEvent("game-created", {
            bubbles: true,
            detail: { players: this.gameEngine._game.players }
        });

        this.dispatchEvent(event);

        await this.gameEngine.start();
    }

    disconnectedCallback() {
        window.removeEventListener("resize", this.resizeCanvasFunction);
    }
}