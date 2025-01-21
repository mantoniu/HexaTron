import {Board} from "./Board.js";
import {getRandomInt} from "./Utils.js";

export const GameType = {
    LOCAL: 0,
    IA: 1,
    RANKED: 2
};

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