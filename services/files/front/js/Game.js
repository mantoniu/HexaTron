import { Board } from "./Board.js";

export class Game {
    constructor(row, column, players) {
        this.board = new Board(row, column);
        this.players = players;
        this.playersPositions = [];
    }

    get getPlayers() {
        return this.players;
    }

    get getPlayersPositions() {
        return this.playersPositions;
    }

    get getBoard() {
        return this.board;
    }
}