import {Status, Tile} from "./Tile.js";

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

    getTitle(position) {
        return this._tiles[position.row][position.column];
    }

    setTitleStatus(position, status) {
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
        return this.getTitle(position).status === Status.VACANT;
    }

    calculateUtils(context) {
        let width = context.canvas.clientWidth;
        let height = context.canvas.clientHeight;
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

    drawLine(i, j, dx, dy, gapX, gapY, size, context) {
        context.beginPath();
        context.moveTo(gapX + dx * (j - 0.5), gapY + dy * (i - 1) + 2 * size);
        context.lineTo(gapX + dx * (j - 0.5), gapY + dy * (i + 1));
        context.stroke();
    }

    draw(context) {
        context.strokeStyle = "black";
        context.lineWidth = 1;
        this._utils = this.calculateUtils(context);

        for (let i = 1; i < this.tiles.length - 1; i++) {
            if (i % 2 === 1) {
                for (let j = 1; j < this.tiles[i].length - 1; j++) {
                    this.tiles[i][j].draw(this._utils.gapX + this._utils.dx * (j - 0.5), this._utils.gapY + this._utils.dy * (i - 1), this._utils.size, context, j === 1);
                    if (i !== 0 && i !== this.tiles.length - 2)
                        this.drawLine(i, j, this._utils.dx, this._utils.dy, this._utils.gapX, this._utils.gapY, this._utils.size, context);
                }
            }
        }
    }

    fillTile(pos, color, direction, context, drawBike) {
        let dPos = [this._utils.gapX + this._utils.dx * (pos.column - (pos.row % 2 === 1 ? 0.5 : 0)), this._utils.gapY + this._utils.dy * (pos.row - 1)];
        this.getTitle(pos).fill(dPos, this._utils.size, context, color, direction, drawBike);
    }

    update(prevPosition, nextPosition, color, context, direction) {
        this.fillTile(nextPosition, color, direction, context, true);

        if (prevPosition)
            this.fillTile(prevPosition, color, direction, context, false);

        this.setTitleStatus(nextPosition, Status.TAKEN);
    }
}
