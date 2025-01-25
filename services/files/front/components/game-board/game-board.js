import {Component} from "../component/component.js";
import {GameEngine} from "../../js/GameEngine.js";
import {CURRENT_USER} from "../../js/UserMock.js";
import {GameType} from "../../js/Game.js";

export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        const canvas = this.shadowRoot.getElementById("board");
        const context = canvas.getContext("2d");
        this.gameEngine = new GameEngine([CURRENT_USER], GameType.LOCAL, 9, 16, 3, 2, context, 200);
        await this.gameEngine.start();
    }
}