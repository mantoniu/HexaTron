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
        return [dx, dy, gapX, gapY, size];
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
        let [dx, dy, gapX, gapY, size] = this.calculateUtils(context);
        for (let i = 1; i < this.tiles.length - 1; i++) {
            if (i % 2 === 1) {
                for (let j = 1; j < this.tiles[i].length - 1; j++) {
                    this.tiles[i][j].draw(gapX + dx * (j - 0.5), gapY + dy * (i - 1), size, context, j === 1);
                    if (i !== 0 && i !== this.tiles.length - 2)
                        this.drawLine(i, j, dx, dy, gapX, gapY, size, context);
                }
            }
        }
    }

    fillTile(x, y, color, context) {
        let [dx, dy, gapX, gapY, size] = this.calculateUtils(context);
        this.tiles[x][y].fillTile(gapX + dx * (x - (y % 2 === 1 ? 0.5 : 0)), gapY + dy * (y - 1), size, context, color);
    }
}
