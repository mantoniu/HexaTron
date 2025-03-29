/**
 * Represents a position on the board.
 */
class Position {
    /**
     * @param {number} row - The row index.
     * @param {number} column - The column index.
     */
    constructor(row, column) {
        /** @type {number} */
        this._row = row;
        /** @type {number} */
        this._column = column;
    }

    /**
     * @returns {number} The row index.
     */
    get row() {
        return this._row;
    }

    /**
     * @param {number} newRow - The new row index.
     */
    set row(newRow) {
        this._row = newRow;
    }

    /**
     * @returns {number} The column index.
     */
    get column() {
        return this._column;
    }

    /**
     * @param {number} newColumn - The new column index.
     */
    set column(newColumn) {
        this._column = newColumn;
    }

    /**
     * Checks if this position is equal to another position.
     *
     * @param {Position} position - The position to compare with.
     * @returns {boolean} True if the positions are equal, otherwise false.
     */
    equals(position) {
        return this.row === position.row && this.column === position.column;
    }
}

module.exports = Position;