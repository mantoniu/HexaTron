import { Board } from "./Board.js";

export class Game {
    constructor(row, column, players) {
        this._board = new Board(row, column);
        this._players = players;
        this._playersPositions = [];
    }

    get players() {
        return this._players;
    }

    get playersPositions() {
        return this._playersPositions;
    }

    get board() {
        return this._board;
    }
}