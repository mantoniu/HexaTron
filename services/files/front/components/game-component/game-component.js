import {GameBoard} from "../game-board/game-board.js";
import {GameHeader} from "../game-header/game-header.js";
import {gameService, GameStatus} from "../../services/game-service.js";
import {GameWaiting} from "../game-waiting/game-waiting.js";
import {ListenerComponent} from "../component/listener-component.js";
import {ResultScreen} from "../result-screen/result-screen.js";

export class GameComponent extends ListenerComponent {
    constructor() {
        super();

        GameBoard.register();
        GameHeader.register();
        GameWaiting.register();
        ResultScreen.register();
    }

    showResultScreen() {
        const gameBoard = this.shadowRoot.querySelector("game-board");
        if (gameBoard)
            gameBoard.style.display = "none";

        const resultScreen = this.shadowRoot.querySelector("result-screen");
        if (resultScreen)
            resultScreen.style.display = "flex";
    }

    async connectedCallback() {
        await super.connectedCallback();

        const gameDiv = this.shadowRoot.getElementById("game");
        this.hideLoader = () => {
            const loader = this.shadowRoot.getElementById("loader");
            if (loader)
                loader.style.display = "none";
            if (gameDiv) {
                gameDiv.style.visibility = "visible";
                gameDiv.style.opacity = "1";
                gameDiv.style.transition = "opacity 0.5s ease-in-out";
            }
        };

        if (gameService.isGameCreated())
            this.hideLoader();

        this.addAutomaticEventListener(gameService, GameStatus.CREATED,
            () => this.hideLoader());

        this.addAutomaticEventListener(gameService, GameStatus.GAME_END,
            () => this.showResultScreen());
    }
}