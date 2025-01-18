import { Status, Tile } from "./Tile.js";

export class Board {
    constructor(row, column) {
        this._tiles = [];
        for (let i = 0; i <= row + 1; i++) {
            let line = [];
            for (let j = 0; j <= column + 1; j++) {
                if (i === 0 || i === row + 1 || j === 0 || j >= (i % 2 === 1 ? column + 1 : column))
                    line.push(new Tile(Status.Wall));
                else
                    line.push(new Tile(Status.Vacant));
            }
            this._tiles.push(line);
        }
    }

    get tiles() {
        return this._tiles;
    }
}
