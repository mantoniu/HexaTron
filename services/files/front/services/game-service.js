import {Game, GameType} from "../js/game/Game.js";
import {LocalPlayer} from "../js/game/LocalPlayer.js";
import {USER_EVENTS, userService} from "./user-service.js";
import {MovementTypes} from "../js/game/GameUtils.js";
import {EventEmitter} from "../js/EventEmitter.js";

/**
 * Enum representing the possible errors
 */
export const GameErrors = Object.freeze({
    ALREADY_IN_GAME: "ALREADY_IN_GAME"
});

/**
 * Enum representing the possible statuses of a game.
 *
 * @constant {Object}
 */
export const GameStatus = {
    CREATED: 'CREATED',
    STARTED: "STARTED",
    POSITIONS_UPDATED: 'POSITION_UPDATED',
    ROUND_END: 'ROUND_END',
    GAME_END: 'GAME_END'
};

/**
 * Service for game management.
 * This class implements the Singleton pattern to ensure a single instance.
 * It extends EventEmitter to handle game-related events.
 *
 * @class GameService
 * @extends EventEmitter
 * @singleton
 */
class GameService extends EventEmitter {
    static _instance = null;

    /**
     * Creates an instance of GameService or returns the existing instance.
     * Initializes the game state, socket connection, and event listeners.
     */
    constructor() {
        super();

        if (GameService._instance)
            return GameService._instance;

        this._game = null;
        this._context = null;

        this._connectGameSocket();
        userService.on(USER_EVENTS.CONNECTION, () => this._connectGameSocket());

        this._shouldInvertPositions = false;
        this._gameCreated = false;

        this.setupListeners();

        window.addEventListener("routeChange", () => this.handleRouteChange());

        GameService._instance = this;
    }

    _connectGameSocket() {
        this._socket = io(`${window.location.origin}/game`, {
            auth: {token: localStorage.getItem("accessToken")},
            autoConnect: true
        });
    }

    /**
     * Gets the socket connection for the game.
     *
     * @returns {Socket} The socket instance.
     */
    get socket() {
        if (!this._socket.connected)
            this._socket.connect();
        return this._socket;
    }

    /**
     * Sets the rendering context for the game.
     *
     * @param {CanvasRenderingContext2D} context - The rendering context.
     */
    set context(context) {
        this._context = context;
    }

    /**
     * Gets the current game instance.
     *
     * @returns {Game} The current game.
     */
    get game() {
        return this._game;
    }

    /**
     * Sets the current game instance.
     *
     * @param {Game} newGame - The new game instance.
     */
    set game(newGame) {
        this._game = newGame;
    }

    /**
     * Retrieves the singleton instance of GameService.
     *
     * @returns {GameService} The singleton instance.
     */
    static getInstance() {
        if (!GameService._instance)
            GameService._instance = new GameService();

        return GameService._instance;
    }

    /**
     * Resets the game state, clearing the current game and context.
     */
    reset() {
        this._game = null;
        this._context = null;
    }

    /**
     * Handles route changes by resetting the game state.
     */
    handleRouteChange() {
        this.reset();
    }

    /**
     * Checks if a game has been created and initialized.
     *
     * @returns {boolean} True if the game is created, false otherwise.
     */
    isGameCreated() {
        return this._gameCreated;
    }

    /**
     * Sets up event listeners for game updates received from the server.
     */
    setupListeners() {
        this.socket.on("refreshStatus", (receivedData) => {
            const {status, data} = receivedData;

            if (!this.game) {
                console.error("Game not initialized");
                return;
            }

            switch (status) {
                case GameStatus.CREATED:
                    this.handleGameCreated(data);
                    break;
                case GameStatus.POSITIONS_UPDATED:
                    this.handlePositionsUpdated(data.newPositions);
                    break;
                case GameStatus.ROUND_END:
                    this.handleRoundEnd(data);
                    break;
                case GameStatus.GAME_END:
                    this.handleGameEnd();
                    break;
                default:
                    console.warn(`Unknown status received: ${status}`);
            }
        });

        this.socket.on("updateELO", (receivedData) => {
            console.log("updateELO", receivedData);
            userService.updateELO(receivedData);
        });

        this.errorListener();
    }

    /**
     * Handles the game creation event.
     *
     * @param {Object} data - The game creation data received from the server.
     * @param {string} data.id - The unique identifier for the newly created game.
     * @param {Object} data.players - An object containing the players participating in the game, keyed by their IDs.
     */
    handleGameCreated({id, players}) {
        this.game.id = id;

        this._shouldInvertPositions = Object.keys(players)[0] !== userService.user._id;
        this.game.players = this._shouldInvertPositions
            ? Object.fromEntries(Object.entries(players).reverse())
            : players;

        this._gameCreated = true;
        this.emit(GameStatus.CREATED);
    }

    /**
     * Inverts a player's position on the board (e.g., for multiplayer games).
     *
     * @private
     * @param {Object} position - The player's current position.
     * @returns {Object} The inverted position.
     */
    _invertPosition(position) {
        return {
            _row: position._row,
            _column: position._row % 2 === 0 ? this.game.board.columnCount - position._column - 2 : this.game.board.columnCount - position._column - 1,
        };
    }

    /**
     * Handles updates to player positions on the board.
     *
     * @param {Object} newPositions - The new positions of the players.
     */
    handlePositionsUpdated(newPositions) {
        if (!this._shouldInvertPositions) {
            this.game.refreshBoard(newPositions, this._context);
            return;
        }

        const updatedPositions = Object.fromEntries(
            Object.entries(newPositions).map(([playerId, position]) => [
                playerId,
                this._invertPosition(position)
            ])
        );

        this.game.refreshBoard(updatedPositions, this._context);
    }

    /**
     * Handles the end of a round.
     *
     * @param {Object} data - The round end data.
     */
    handleRoundEnd(data) {
        this.emit(GameStatus.ROUND_END, data);
        this.game.resetBoard(this._context);
        this.game.playersPositions = [];
    }

    /**
     * Sets up an error listener for socket errors.
     */
    errorListener() {
        this.socket.on("error", (error) => {
            console.error(error);
            if (error?.type === GameErrors.ALREADY_IN_GAME)
                alert("You are currently in a game. Please wait until it ends.");
            else
                alert("An error occurred, please try again later.");
            window.location.href = "/";
        });
    }

    /**
     * Handles the end of the game.
     */
    handleGameEnd() {
        this._clear();
        this.emit(GameStatus.GAME_END);
    }

    /**
     * Starts a new game with the specified game type.
     *
     * @param {Number} gameType - The type of game to start.
     */
    startGame(gameType) {
        if (this.game?.id)
            return;

        const player = new LocalPlayer(userService.user._id, userService.user.name, userService.user.parameters.keysPlayers[0]);

        const players = [player];
        if (gameType === GameType.LOCAL) {
            const guest = new LocalPlayer("guest",
                (userService.isConnected()) ? "Guest" : "Guest 1",
                userService.user.parameters.keysPlayers[1]);
            players.push(guest);
        }

        this._game = new Game(gameType, 9, 16, players, 3);

        this.socket.emit("joinGame", {
            gameType,
            players: players.map(player => ({id: player.id, name: player.name}))
        }, (id) => this.game.id = id);

        this.emit(GameStatus.STARTED);
    }

    /**
     * Draws the current game state on the canvas.
     */
    draw() {
        if (this.game)
            this.game.draw(this._context);
    }

    /**
     * Inverts a move
     *
     * @private
     * @param {string} move - The move to invert.
     * @returns {string} The inverted move.
     */
    _invertMove(move) {
        const movements = Object.values(MovementTypes);
        const index = movements.indexOf(move);
        if (index === -1)
            return move;

        const mirroredIndex = movements.length - 1 - index;
        return movements[mirroredIndex];
    }

    /**
     * Sends the player's next move to the server.
     *
     * @param {string} playerId - The ID of the player making the move.
     * @param {string} move - The move to make.
     */
    nextMove(playerId, move) {
        if (this._shouldInvertPositions)
            move = this._invertMove(move);

        this.socket.emit("nextMove", {gameId: this.game.id, playerId, move});
    }

    /**
     * Leaves the current game by notifying the server and clearing local game state.
     */
    leaveGame() {
        if (!this.game?.id)
            return;

        this.socket.emit("leaveGame", this.game.id);
        this._clear();
    }

    /**
     * Clears all internal game state and resets the service to its initial condition.
     * @private
     */
    _clear() {
        this._gameCreated = false;
        this._game = null;
        this._context = null;
        this._shouldInvertPositions = false;
    }
}

export const gameService = GameService.getInstance();