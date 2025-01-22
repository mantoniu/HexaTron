import {Board} from "./Board.js";
import {getRandomInt} from "./Utils.js";

export const GameType = {
    LOCAL: 0,
    IA: 1,
    RANKED: 2
};

export class Game {
    constructor(type, rowNumber, columnNumber, players, roundsCount) {
        this._type = type;
        this._board = new Board(rowNumber, columnNumber);
        this._players = players;
        this._playersPositions = {};
        this._roundsCount = roundsCount;
    }

    get players() {
        return this._players;
    }

    get roundsCount() {
        return this._roundsCount;
    }

    get playersPositions() {
        return this._playersPositions;
    }

    get type() {
        return this._type;
    }

    set playersPositions(playersPosition) {
        this._playersPositions = playersPosition;
    }

    getPlayerPosition(playerId) {
        return this._playersPositions[playerId];
    }

    setPlayerPosition(playerId, position) {
        this._playersPositions[playerId] = position;
    }

    get board() {
        return this._board;
    }

    resetBoard(canvas) {
        this._board.initialize();
        canvas.reset();
    }

    draw(canvas) {
        this.board.draw(canvas);
    }

    generatePossibleStartPositions() {
        let possibleRows = [];

        for (let i = 1; i < this.board.rowCount; i += 2)
            possibleRows.push(i);

        const firstPlayerPos = [possibleRows[getRandomInt(possibleRows.length)], 1];
        const secondPlayerPos = [
            this.board.rowCount - firstPlayerPos[0] - 1,
            this.board.columnCount - 2
        ];
        const thirdPlayerPos = [secondPlayerPos[0], 1];
        const fourthPlayerPos = [firstPlayerPos[0], this.board.columnCount - 2];

        return [firstPlayerPos, secondPlayerPos, thirdPlayerPos, fourthPlayerPos];
    }

    setPlayersStartPositions() {
        if (this.players.length < 1 || this._players.length > 4)
            throw new Error("Unsupported number of players. Only 2, 3, or 4 players are allowed.");

        let resultDict = {};

        let possiblesPositions = this.generatePossibleStartPositions();

        for (let i = 0; i < this.players.length; i++)
            resultDict[this.players[i].id] = possiblesPositions[i];

        this.playersPositions = resultDict;
    }
}