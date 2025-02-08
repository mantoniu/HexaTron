import {Game} from "../js/game/Game.js";

export class GameService {
    static _instance = null;

    constructor() {
        if (GameService._instance) {
            return GameService._instance;
        }

        this._game = null;
        this._socket = io(`http://${window.location.hostname}:8000/game`);

        this._socket.on("connect", () => {
            console.log("user connected " + this._socket.id);
        });

        this.setupListeners();

        GameService._instance = this;
    }

    get socket() {
        return this._socket;
    }

    get game() {
        return this._game;
    }

    set game(newGame) {
        this._game = newGame;
    }

    static getInstance() {
        if (!GameService._instance) {
            GameService._instance = new GameService();
        }
        return GameService._instance;
    }

    setupListeners() {
        this._socket.on("refreshStatus", (data) => {
            console.log(data);

            if (!this.game) {
                console.error("Game not initialized");
                return;
            }

            switch (data.status) {
                case "gameCreated":
                    this.game.id = data.data.id;
                    break;
                case "newPositions":
                    this.game.refreshBoard(data.data.newPositions);
                    break;
                case "roundEnd":
                    this.game.printResults(data.data);
                    this.game.resetBoard();
                    this.game.playersPositions = [];
                    break;
                case "end":
                    console.log("The game is finished");
                    this._game = null;
                    break;
            }
        });
    }

    startGame(gameType, rowNumber, columnNumber, users, roundsCount, context) {
        if (this.game)
            return;

        this._game = new Game(gameType, rowNumber, columnNumber, users, roundsCount, context);
        let playersCount = 2;

        const filteredUsers = users.map(dict => ({id: dict.id, name: dict.name}));

        this._socket.emit("start", {
            gameType,
            rowNumber,
            columnNumber,
            roundsCount,
            playersCount,
            users: filteredUsers
        });
    }

    draw() {
        if (this.game)
            this.game.draw();
    }

    nextMove(playerId, move) {
        this._socket.emit("nextMove", {gameId: this.game.id, playerId, move});
    }
}
