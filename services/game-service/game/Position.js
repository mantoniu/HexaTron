class Position {
    constructor(row, column) {
        this._row = row;
        this._column = column;
    }

    get row() {
        return this._row;
    }

    set row(newRow) {
        this._row = newRow;
    }

    get column() {
        return this._column;
    }

    set column(newColumn) {
        this._column = newColumn;
    }

    equals(position) {
        return this.row === position.row && this.column === position.column;
    }
}

module.exports = Position;