import {Component} from "../component/component.js";
import {GameEngine} from "../../js/GameEngine.js";

export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        const canvas = this.shadowRoot.getElementById("board");
        const context = canvas.getContext("2d");
        this.gameEngine = new GameEngine(context, 2, [["a", "q", "e", "d"], ["1", "2", "3", "4"]], ["#ff0000", "#40ff00"]);
        await this.gameEngine.start();
    }
}