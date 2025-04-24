import {GameBoard} from "../game-board/game-board.js";
import {GameHeader} from "../game-header/game-header.js";
import {gameService, GameStatus} from "../../services/game-service.js";
import {GameWaiting} from "../game-waiting/game-waiting.js";
import {ListenerComponent} from "../component/listener-component.js";
import {ResultScreen} from "../result-screen/result-screen.js";
import {userService} from "../../services/user-service.js";
import {GameJoystick} from "../game-joystick/game-joystick.js";
import {GameType} from "../../js/game/Game.js";
import {hapticVibration} from "../../js/config.js";

export class GameComponent extends ListenerComponent {
    constructor() {
        super();

        GameBoard.register();
        GameHeader.register();
        GameWaiting.register();
        ResultScreen.register();
        GameJoystick.register();
    }

    showResultScreen(results) {
        const gameBoard = this.shadowRoot.querySelector("game-board");
        if (gameBoard)
            gameBoard.style.display = "none";

        this.shadowRoot.querySelectorAll("game-joystick")?.forEach(joystick => joystick.style.display = "none");

        const result_screen = this.shadowRoot.getElementById("game").querySelector("result-screen");
        if (result_screen) {
            result_screen.setAttribute("end", "true");
            result_screen.setAttribute("results", JSON.stringify(results));
        }
    }

    async connectedCallback() {
        await super.connectedCallback();

        const gameType = Number(this.getAttribute("type"));
        const stringParams = this.getAttribute("params");
        const params = JSON.parse(stringParams);

        this._loader = this.shadowRoot.querySelector("game-waiting");
        this._loader.setAttribute("game-type", gameType.toString());
        if (params?.friendId) {
            const friendName = userService.user.friends[params.friendId].name;
            this._loader.setAttribute("friend-name", friendName);
        }
        this._loader.setAttribute("params", stringParams);

        gameService.startGame(gameType, params);

        this._gameDiv = this.shadowRoot.getElementById("game");
        this.hideLoader = () => hapticVibration().then(() => {
            if (this._loader)
                this._loader.style.display = "none";
            if (this._gameDiv) {
                this._gameDiv.style.visibility = "visible";
                this._gameDiv.style.opacity = "1";
                this._gameDiv.style.transition = "opacity 0.5s ease-in-out";
                this._gameDiv.querySelector("result-screen").setAttribute("end", "false");
            }
        });

        if (Capacitor.isNativePlatform())
            this._addJoySticks();

        if (gameService.isGameCreated())
            this.hideLoader();

        this.addAutomaticEventListener(gameService, GameStatus.CREATED,
            () => this.hideLoader());

        this.addAutomaticEventListener(gameService, GameStatus.GAME_END,
            (event) => this.showResultScreen(event));
    }

    _addJoySticks() {
        if (gameService.game.type !== GameType.LOCAL) {
            this._addJoystickForPlayer(userService.user._id);
            return;
        }

        const localPlayers = Object.values(gameService.game.players);
        localPlayers.forEach(player => {
            this._addJoystickForPlayer(player.id);
        });
    }

    _addJoystickForPlayer(playerId) {
        const joystick = document.createElement("game-joystick");

        joystick.setAttribute("position",
            (playerId === userService.user._id) ? "left" : "right");

        joystick.addEventListener("joystickMove", (event) => {
            const direction = event.detail;
            gameService.nextMove(playerId, direction);
        });

        this._gameDiv.appendChild(joystick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        gameService.leaveGame();
    }
}