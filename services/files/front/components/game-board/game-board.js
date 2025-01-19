import { Component } from "../component/component.js";
import { GameEngine, GameType } from "../../js/GameEngine.js";

export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        const canvas = this.shadowRoot.getElementById("board");
        const context = canvas.getContext("2d");
        this.gameEngine = new GameEngine(GameType.LOCAL, context);
    }
}