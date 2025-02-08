const {Status, Tile} = require("./Tile");

class Board {
    constructor(row, column) {
        this._tiles = [];
        this._row = row;
        this._column = column;

        this.initialize();
    }

    get rowCount() {
        return this._row + 2;
    }

    get tiles() {
        return this._tiles;
    }

    get columnCount() {
        return this._column + 2;
    }

    getTitle(position) {
        return this._tiles[position.row][position.column];
    }

    setTileStatus(position, status) {
        this.getTitle(position).status = status;
    }

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
