import {Component} from "../component/component.js";
import {resizeCanvas} from "../../js/Utils.js";
import {GameService} from "../../services/game-service.js";

export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        const canvas = this.shadowRoot.getElementById("board");
        GameService.getInstance().context = canvas.getContext("2d");

        this.resizeCanvasFunction = () => {
            resizeCanvas.call(this, 0.85, 0.80, "board",
                () => GameService.getInstance().draw()
            );
        };

        this.resizeCanvasFunction();

        this.addAutoCleanListener(window, "resize", this.resizeCanvasFunction);
    }
}