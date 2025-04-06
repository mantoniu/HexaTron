import {Status, Tile} from "./Tile.js";

const BACKGROUND_COLOR = "#f5f7fa";
const STROKE_COLOR_INSIDE = "#a2aab2";
const STROKE_COLOR_OUTSIDE = "#4e5256";


export class Board {
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

    getTile(position) {
        return this._tiles[position.row][position.column];
    }

    setTileStatus(position, status) {
        this.getTile(position).status = status;
    }

    initialize() {
        if (this.tiles.length === 0) {
            for (let i = 0; i <= this._row + 1; i++) {
                let line = [];
                for (let j = 0; j <= this._column + 1; j++) {
                    if (i === 0 || i === this._row + 1 || j === 0 || j >= (i % 2 === 1 ? this._column + 1 : this._column))
                        line.push(new Tile(Status.WALL, BACKGROUND_COLOR));
                    else
                        line.push(new Tile(Status.VACANT, BACKGROUND_COLOR));
                }
                this._tiles.push(line);
            }
        } else {
            for (let i = 0; i <= this._row + 1; i++) {
                for (let j = 0; j <= this._column + 1; j++) {
                    if (i === 0 || i === this._row + 1 || j === 0 || j >= (i % 2 === 1 ? this._column + 1 : this._column))
                        this.tiles[i][j].refreshTile(Status.WALL);
                    else
                        this.tiles[i][j].refreshTile(Status.VACANT);
                }
            }
        }
    }

    calculateUtils(context) {
        context.lineCap = "round";
        context.lineWidth = 8;

        let width = context.canvas.width - 2 * context.lineWidth;
        let height = context.canvas.height - 2 * context.lineWidth;
        let angle = 60 * Math.PI / 180;
        let sizeAccordingWidth = width / ((this.tiles[0].length - 2) * 2 * Math.sin(angle));
        let sizeAccordingHeight = height / (3 * Math.floor((this.tiles.length - 2) / 2) + ((this.tiles.length) % 2 === 1 ? 2 : 0));
        let size = sizeAccordingWidth > sizeAccordingHeight ? sizeAccordingHeight : sizeAccordingWidth;
        let dx = 2 * size * Math.sin(angle);
        let dy = (3 / 2) * size;
        let gapX = sizeAccordingWidth > sizeAccordingHeight ? (width - dx * (this.tiles[0].length - 2)) / 2 : 0;
        let gapY = sizeAccordingHeight > sizeAccordingWidth ? (height - 3 * size * Math.floor((this.tiles.length - 2) / 2) - (this.tiles.length % 2 === 1 ? 2 * size : 0)) / 2 : 0;
        return {dx, dy, gapX, gapY, size};
    }

    getStrokeColor(i, j, color) {
        return [
            (i === 1) || (i % 2 === 1 && j === this._tiles[i].length - 2) ? STROKE_COLOR_OUTSIDE : color,
            j === this._tiles[i].length - (i % 2 === 1 ? 1 : 2) - 1 ? STROKE_COLOR_OUTSIDE : color,
            (i === this._tiles.length - 2) || (i % 2 === 1 && j === this._tiles[i].length - 2) ? STROKE_COLOR_OUTSIDE : color,
            (i === this._tiles.length - 2) || (i % 2 === 1 && j === 1) ? STROKE_COLOR_OUTSIDE : color,
            j === 1 ? STROKE_COLOR_OUTSIDE : color,
            (i === 1) || (i % 2 === 1 && j === 1) ? STROKE_COLOR_OUTSIDE : color];
    }

    draw(context) {
        this._utils = this.calculateUtils(context);

        for (let i = 1; i < this.tiles.length - 1; i++) {
            for (let j = 1; j < this.tiles[i].length - (i % 2 === 1 ? 1 : 2); j++) {
                this.tiles[i][j].fill([this._utils.gapX + this._utils.dx * (j - (i % 2) / 2) + context.lineWidth, this._utils.gapY + this._utils.dy * (i - 1) + context.lineWidth], this._utils.size, context, this.getStrokeColor(i, j, STROKE_COLOR_INSIDE), BACKGROUND_COLOR);
            }
        }
    }

    fillTile(pos, color, direction, context, drawBike, finalState = false) {
        if (!this._utils)
            this._utils = this.calculateUtils(context);
        let dPos = [this._utils.gapX + this._utils.dx * (pos.column - (pos.row % 2 === 1 ? 0.5 : 0)) + context.lineWidth, this._utils.gapY + this._utils.dy * (pos.row - 1) + context.lineWidth];
        this.getTile(pos).fill(dPos, this._utils.size, context, this.getStrokeColor(pos.row, pos.column, color), color, direction, drawBike, true, finalState);
    }

    update(prevPosition, nextPosition, color, context, direction) {
        if (!context)
            return;

        this.fillTile(nextPosition, color, direction, context, true);

        if (prevPosition)
            this.fillTile(prevPosition, color, direction, context, false, true);

        this.setTileStatus(nextPosition, Status.TAKEN);
    }
}
