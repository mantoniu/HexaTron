import {Component} from "../component/component.js";
import {gameService} from "../../services/game-service.js";

export class GameBoard extends Component {

    constructor() {
        super();
        this._canvas = null;
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._canvas = this.shadowRoot.getElementById("board");
        gameService.context = this._canvas.getContext("2d");

        this._canvas.width = 3840;
        this._canvas.height = 2160;

        console.log("screen", this._canvas.width, this._canvas.height);

        gameService.draw();
    }
}