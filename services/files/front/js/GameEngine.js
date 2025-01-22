import {Game, GameType} from "./Game.js";
import {Player} from "./Player.js";
import {Parameters} from "./Parameters.js";
import {MovementManager} from "./MovementManager.js";

export class GameEngine {
    constructor(context, playersCount, keys, colors) {
        this._canvas = context;
        this._keys = keys;
        this._colors = colors;

        let players = []
        for (let i = 0; i < playersCount; i++)
            players.push(new Player(`${i}`, `Player ${i}`, "", new Parameters()));
        this._game = new Game(GameType.LOCAL, 9, 16, players, 3);

        this.initializeMovementsManagers();
    }

    initialize() {
        this._game.setPlayersStartPositions();
        this._game.draw(this._canvas);

        this._movementsManagers.forEach(manager =>
            manager.initialize(this._game.getPlayerPosition(manager.playerId)));

        for (let i = 0; i < this._game.players.length; i++) {
            let playerPosition = this._game.getPlayerPosition(this._game.players[i].id);
            this._game.board.fillTile(playerPosition[0], playerPosition[1], this._colors[i], this._canvas);
        }
    }

    initializeMovementsManagers() {
        this._movementsManagers = [];

        for (let i = 0; i < this._game.players.length; i++) {
            this._movementsManagers.push(
                new MovementManager(
                    this._game,
                    this._canvas,
                    this._game.players[i].id,
                    this._colors[i],
                    this._keys[i],
                )
            )
        }
    }

    async start() {
        for (let round = 0; round < this._game.roundsCount; round++) {
            console.log(`Starting round ${round}`);
            const result = await this.runRound();
            this.printResults(result);
            this._game.resetBoard(this._canvas);
        }
        console.log("All rounds completed!");
    }

    runRound() {
        return new Promise((resolve) => {
            this.initialize();
            let intervalId = setInterval(() => {
                let results = []
                this._movementsManagers.forEach(manager => results.push(!manager.handleKeyPress()));

                if (results.includes(true)) {
                    clearInterval(intervalId);
                    resolve(results);
                }
            }, 200);
        });
    }

    printResults(results) {
        const winners = [];
        const players = this._game.players;

        for (let i = 0; i < results.length; i++) {
            if (!results[i])
                winners.push(players[i].name);
        }

        if (winners.length === 0)
            console.log("All players have lost!");
        else if (winners.length === 1)
            console.log(`The winner of this round is: ${winners[0]}!`);
        else console.log(`It's a tie between players: ${winners.join(", ")}!`);
    }
}