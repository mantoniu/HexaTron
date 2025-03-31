const Board = require("./Board");
const Position = require("./Position");
const {getRandomInt} = require("./Utils");
const {Status} = require("./Tile");

/**
 * Enum for game types.
 *
 * @readonly
 * @enum {number}
 */
const GameType = Object.freeze({
    LOCAL: 0,
    AI: 1,
    RANKED: 2,
    FRIENDLY: 3
});

/**
 * Represents a game instance.
 */
class Game {
    /**
     * @param {number} type - The type of the game.
     * @param {number} rowNumber - The number of rows in the board.
     * @param {number} columnNumber - The number of columns in the board.
     * @param {Map<string, Player>} players - A map of player IDs to Player objects.
     * @param {number} roundsCount - The number of rounds in the game.
     */
    constructor(type, rowNumber, columnNumber, players, roundsCount) {
        /** @type {number} */
        this._type = type;
        /** @type {Board} */
        this._board = new Board(rowNumber, columnNumber);
        /** @type {Map<string, Player>} */
        this._players = players;
        /** @type {Record<string, Position>} */
        this._playersPositions = {};
        /** @type {number} */
        this._roundsCount = roundsCount;
    }

    /**
     * @returns {Map<string, Player>} The players in the game.
     */
    get players() {
        return this._players;
    }

    /**
     * @returns {number} The total number of rounds in the game.
     */
    get roundsCount() {
        return this._roundsCount;
    }

    /**
     * @returns {Record<string, Position>} The current positions of all players.
     */
    get playersPositions() {
        return this._playersPositions;
    }

    /**
     * @param {Record<string, Position>} playersPosition - The new positions of the players.
     */
    set playersPositions(playersPosition) {
        this._playersPositions = playersPosition;
        Object.values(playersPosition).forEach(pos => this.board.setTileStatus(pos, Status.TAKEN));
    }

    /**
     * @returns {number} The type of the game.
     */
    get type() {
        return this._type;
    }

    /**
     * @returns {Board} The game board.
     */
    get board() {
        return this._board;
    }

    /**
     * Retrieves a player by their ID.
     *
     * @param {string} playerId - The ID of the player.
     * @returns {Player} The player object.
     */
    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    /**
     * Retrieves the position of a player.
     *
     * @param {string} playerId - The ID of the player.
     * @returns {Position} The position of the player.
     */
    getPlayerPosition(playerId) {
        return this._playersPositions[playerId];
    }

    /**
     * Sets the position of a player on the board.
     *
     * @param {string} playerId - The ID of the player.
     * @param {Position} position - The new position of the player.
     */
    setPlayerPosition(playerId, position) {
        this._playersPositions[playerId] = position;
        this.board.setTileStatus(position, Status.TAKEN);
    }

    /**
     * Resets the board to its initial state.
     */
    resetBoard() {
        this._board.initialize();
    }

    /**
     * Generates possible starting positions for players.
     *
     * @returns {Position[]} An array of possible start positions.
     */
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

    /**
     * Sets the starting positions for the players.
     *
     * @throws {Error} If the number of players is not between 1 and 4.
     */
    setPlayersStartPositions() {
        let playersLength = this.players.size;
        if (playersLength < 1 || playersLength > 4)
            throw new Error("Unsupported number of players.");

        let possiblePositions = this.generatePossibleStartPositions();
        let playerIds = Array.from(this.players.keys());

        this.playersPositions = Object.fromEntries(
            playerIds.map((playerId, index) => [playerId, possiblePositions[index]])
        );
    }

}

module.exports = {Game, GameType};