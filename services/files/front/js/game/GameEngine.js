import {Game, GameType} from "./Game.js";
import {Directions, DISPLACEMENT_FUNCTIONS} from "./GameUtils.js";
import {PlayerFactory} from "./PlayerFactory.js";
import {PlayerState} from "../ai/PlayerState.js";
import {LocalPlayer} from "./LocalPlayer.js";

export class GameEngine {
    constructor(users, gameType, rowNumber, columnNumber, roundsCount, playersCount, context, choiceTime) {
        this._canvas = context;
        this._choiceTime = choiceTime;

        switch (gameType) {
            case GameType.LOCAL:
            case GameType.AI:
                this.initGame(users[0], gameType, playersCount, rowNumber, columnNumber, roundsCount);
                break;
            default:
                throw new Error(`The ${gameType} game type is not yet supported.`);
        }
    }

    initGame(user, gameType, playersCount, rowNumber, columnNumber, roundsCount) {
        let players = {["0"]: new LocalPlayer("0", user.name, user.parameters.playersColors[0], null, user.parameters.keys[0])};

        for (let i = 1; i < playersCount; i++) {
            players[`${i}`] = PlayerFactory.createPlayer(
                gameType,
                `${i}`,
                user.parameters.playersColors[i],
                gameType === GameType.LOCAL ? user.parameters.keys[i] : null
            );
        }

        this._game = new Game(gameType, rowNumber, columnNumber, players, roundsCount);
    }

    initializePlayersDirections() {
        this._playersDirections = {};
        for (let playerId of Object.keys(this._game.players))
            this._playersDirections[playerId] = this._game.getPlayerPosition(playerId).column === 1 ? Directions.RIGHT : Directions.LEFT;
    }

    initialize() {
        this._game.setPlayersStartPositions();
        this._game.draw(this._canvas);

        this.initializePlayersDirections();

        for (let player of Object.values(this._game.players)) {
            let playerPosition = this._game.getPlayerPosition(player.id);
            player.setup(this.getPlayerState(player));

            this._game.board.update(null, playerPosition, player.color, this._canvas, this._playersDirections[player.id]);
        }
    }

    async start() {
        for (let round = 0; round < this._game.roundsCount; round++) {
            const result = await this.runRound();
            this.printResults(result);
            this._game.resetBoard(this._canvas);
        }
    }

    getPlayerState(player) {
        let playerPosition = this._game.getPlayerPosition(player.id);
        let opponentPosition = Object.entries(this._game.playersPositions).find(([k, _]) => k !== player.id)?.[1];

        return new PlayerState(playerPosition, opponentPosition);
    }

    computeNewPositions() {
        let newPositions = {};

        for (let player of Object.values(this._game.players)) {
            const direction = player.nextMove(this.getPlayerState(player)) ?? this._playersDirections[player.id];
            this._playersDirections[player.id] = direction;

            const pos = DISPLACEMENT_FUNCTIONS[direction](this._game.getPlayerPosition(player.id));

            if (this._game.board.checkPositionValidity(pos))
                newPositions[player.id] = pos;
        }

        return newPositions;
    }

    checkEqualities(positions) {
        let equals = {};
        const playerIds = Object.keys(positions);

        for (let i = 0; i < playerIds.length; i++) {
            for (let j = i + 1; j < playerIds.length; j++) {
                const playerId1 = playerIds[i];
                const playerId2 = playerIds[j];

                if (positions[playerId1].equals(positions[playerId2])) {
                    if (!equals[positions[playerId1]])
                        equals[positions[playerId1]] = new Set([playerId1, playerId2]);
                    else
                        equals[positions[playerId1]].add(playerId2);
                }
            }
        }

        return Object.keys(equals).length ? Object.values(equals) : null;
    }

    runRound() {
        return new Promise((resolve) => {
            this.initialize();
            let intervalId = setInterval(() => {
                const validPositions = this.computeNewPositions();

                let equalities = this.checkEqualities(validPositions);

                if (equalities) {
                    clearInterval(intervalId);
                    resolve({status: "equality", equalities});
                    return;
                }

                const winners = Object.keys(this._game.players).filter(playerId => playerId in validPositions);

                if (Object.keys(this._game.players).length !== Object.keys(validPositions).length) {
                    clearInterval(intervalId);
                    resolve({status: "round_end", winners});
                    return;
                }

                for (let playerId of Object.keys(validPositions)) {
                    let player = this._game.getPlayer(playerId);

                    this._game.board.update(this._game.getPlayerPosition(player.id), validPositions[playerId], player.color, this._canvas, player.comingDirection);
                    this._game.setPlayerPosition(player.id, validPositions[playerId]);
                }
            }, this._choiceTime);
        });
    }

    printRoundEndResults(winners) {
        const winnersNames = winners.map(winnerId => this._game.getPlayer(winnerId).name);

        if (winners.length === 0)
            alert("All players have lost!");
        else if (winners.length === 1)
            alert(`The winner of this round is: ${winnersNames[0]}!`);
        else alert(`It's a tie between players: ${winnersNames.join(", ")}!`);
    }

    printEqualityResults(equalities) {
        let message = "";
        for (const equality of equalities) {
            message += "Equality between players: ";
            equality.forEach(playerId => message += this._game.getPlayer(playerId).name + ", ");
            message = message.slice(0, -2);
            message += "\n";
        }
        alert(message);
    }

    printResults(result) {
        switch (result.status) {
            case "equality":
                this.printEqualityResults(result.equalities);
                break;
            case "round_end":
                this.printRoundEndResults(result.winners);
                break;
            default:
                throw Error(`The status ${result.status} is not yet supported`);
        }
    }

    draw(callingContext) {
        callingContext._game.board.draw(callingContext._canvas);
    }
}