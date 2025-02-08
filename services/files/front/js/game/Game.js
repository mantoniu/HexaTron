import {Board} from "./Board.js";
import {getRandomInt} from "../Utils.js";
import {Position} from "./Position.js";
import {Directions, DISPLACEMENT_FUNCTIONS} from "./GameUtils.js";
import {CURRENT_USER} from "../UserMock.js";

export const GameType = {
    LOCAL: 0,
    AI: 1,
    RANKED: 2
};

export class Game {
    constructor(type, rowNumber, columnNumber, players, roundsCount, context) {
        this._id = null;
        this._context = context;
        this._type = type;
        this._board = new Board(rowNumber, columnNumber);
        this._players = players;
        this._playersPositions = {};
        this._roundsCount = roundsCount;
    }

    get id() {
        return this._id;
    }

    set id(newId) {
        this._id = newId;
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

    getPlayer(playerId) {
        return this.players[playerId];
    }

    set playersPositions(playersPosition) {
        this._playersPositions = playersPosition;
    }

    obtainDirection(prevPosition, newPosition) {
        if (!prevPosition || prevPosition.equals(newPosition))
            return newPosition.column === 1
                ? Directions.RIGHT
                : Directions.LEFT;

        const displacementResults = DISPLACEMENT_FUNCTIONS.map((fun, index) => ({
            result: fun(prevPosition),
            index
        }));

        return displacementResults.find(({result}) => result.equals(newPosition)).index;
    }

    refreshBoard(playersPosition) {
        Object.entries(playersPosition).forEach(([player, position], i) => {
            const curPosition = new Position(...Object.values(position));
            const prevPosition = this._playersPositions[player];

            this.board.update(
                prevPosition,
                curPosition,
                CURRENT_USER.parameters.playersColors[i],
                this._context,
                this.obtainDirection(prevPosition, curPosition)
            );

            this._playersPositions[player] = curPosition;
        });
    }

    getPlayerPosition(playerId) {
        return this._playersPositions[playerId];
    }

    setPlayerPosition(playerId, position) {
        this._playersPositions[playerId] = position;
        this.board.fillTile(position, "black", Directions.UPPER_RIGHT, this._context, false);
    }

    get board() {
        return this._board;
    }

    resetBoard() {
        this._board.initialize();
        this._context.reset();
        this.draw();
    }

    draw() {
        this.board.draw(this._context);
    }

    generatePossibleStartPositions() {
        let possibleRows = [];

        for (let i = 1; i < this.board.rowCount; i += 2)
            possibleRows.push(i);

        const firstPlayerPos = new Position(possibleRows[getRandomInt(possibleRows.length)], 1);
        const secondPlayerPos = new Position(
            this.board.rowCount - firstPlayerPos.row - 1,
            this.board.columnCount - 2
        );
        const thirdPlayerPos = new Position(secondPlayerPos.row, 1);
        const fourthPlayerPos = new Position(firstPlayerPos.row, this.board.columnCount - 2);

        return [firstPlayerPos, secondPlayerPos, thirdPlayerPos, fourthPlayerPos];
    }

    setPlayersStartPositions() {
        let playersLength = Object.keys(this.players).length;
        if (playersLength < 1 || playersLength > 4)
            throw new Error("Unsupported number of players.");

        let resultDict = {};
        let possiblesPositions = this.generatePossibleStartPositions();

        for (let i = 0; i < playersLength; i++)
            resultDict[this.players[i].id] = possiblesPositions[i];

        this.playersPositions = resultDict;
    }

    printRoundEndResults(name) {
        console.log(`The winner of this round is: ${name}!`);
    }

    printTiesResults(ties) {
        const message = ties
            .map(tie => "There is a tie between players: " + [...tie].join(", "))
            .join("\n");

        console.log(message);
    }

    printResults(result) {
        switch (result.status) {
            case "tie":
                this.printTiesResults(result.ties);
                break;
            case "winner":
                this.printRoundEndResults(result.winner);
                break;
            default:
                throw Error(`The status ${result.status} is not yet supported`);
        }
    }
}