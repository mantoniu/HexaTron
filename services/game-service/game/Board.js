const {Status, Tile} = require("./Tile");

/**
 * Represents the game board.
 */
class Board {
    /**
     * @param {number} row - The number of rows.
     * @param {number} column - The number of columns.
     */
    constructor(row, column) {
        /** @type {Tile[][]} */
        this._tiles = [];
        /** @type {number} */
        this._row = row;
        /** @type {number} */
        this._column = column;

        this.initialize();
    }

    /**
     * @returns {number} The total number of rows including boundaries.
     */
    get rowCount() {
        return this._row + 2;
    }

    /**
     * @returns {Tile[][]} The tiles on the board.
     */
    get tiles() {
        return this._tiles;
    }

    /**
     * @returns {number} The total number of columns including boundaries.
     */
    get columnCount() {
        return this._column + 2;
    }

    /**
     * Retrieves the tile at the given position.
     *
     * @param {Position} position - The position of the tile.
     * @returns {Tile} The tile at the specified position.
     */
    getTitle(position) {
        return this._tiles[position.row][position.column];
    }

    /**
     * Sets the status of a tile at a given position.
     *
     * @param {Position} position - The position of the tile.
     * @param {Status} status - The new status of the tile.
     */
    setTileStatus(position, status) {
        this.getTitle(position).status = status;
    }

    /**
     * Initializes the board by creating tiles with appropriate statuses.
     */
    initialize() {
        this._tiles = [];
        for (let i = 0; i <= this._row + 1; i++) {
            let line = [];
            for (let j = 0; j <= this._column + 1; j++) {
                if (i === 0 || i === this._row + 1 || j === 0 || j >= (i % 2 === 1 ? this._column + 1 : this._column))
                    line.push(new Tile(Status.WALL));
                else
                    line.push(new Tile(Status.VACANT));
            }
            this._tiles.push(line);
        }
    }

    /**
     * Checks if a position is valid and vacant.
     *
     * @param {Position} position - The position to check.
     * @returns {boolean} True if the position is valid and vacant, otherwise false.
     */
    checkPositionValidity(position) {
        return (
            position.row > 0 &&
            position.row <= this.rowCount &&
            position.column > 0 &&
            position.column <= this.columnCount - (position.row % 2 === 0 ? 1 : 0) &&
            this.getTitle(position).status === Status.VACANT
        );
    }
}

module.exports = Board;
