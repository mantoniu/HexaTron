import {Component} from "../component/component.js";
import {GameEngine} from "../../js/game/GameEngine.js";
import {CURRENT_USER} from "../../js/UserMock.js";
import {GameType} from "../../js/game/Game.js";
import {resizeCanvas} from "../../js/Utils.js";


export class GameBoard extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        const canvas = this.shadowRoot.getElementById("board");
        const context = canvas.getContext("2d");
        this.gameEngine = new GameEngine([CURRENT_USER], GameType.LOCAL, 9, 16, 3, 2, context);

        let curPlayer = new LocalPlayer("0", "Test 1", "red", "", CURRENT_USER.parameters.keys[0]);
        let player = new LocalPlayer("1", "Test 2", "blue", "", CURRENT_USER.parameters.keys[1]);
        GameService.getInstance().startGame(GameType.LOCAL, 9, 16, [curPlayer, player], 3, context);

        const resizeCanvasFunction = () => {
            resizeCanvas.call(
                this,
                0.85,
                0.80,
                "board",
                () => GameService.getInstance().draw()
            );
        };

        resizeCanvasFunction();

        window.addEventListener("resize", resizeCanvasFunction);

        await this.gameEngine.start();
    }

    disconnectedCallback() {
        window.removeEventListener("resize", this.resizeCanvasFunction);
    }
}