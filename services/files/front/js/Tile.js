export const Status = {
    WALL: -1,
    VACANT: 0,
    TAKEN: 1
};

export class Tile {
    constructor(status) {
        this.status = status;
        this.takenID = "";
    }

    get takenID() {
        if (this.status !== Status.TAKEN) throw new Error("The Tile is not taken by a player");
        return this._takenID;
    }

    get status() {
        return this._status;
    }

    set status(status) {
        this._status = status;
    }

    set takenID(id) {
        this._takenID = id;
    }

    hexagonPath(posX, posY, size, context, edges, fill) {
        context.beginPath();
        context.moveTo(posX, posY);
        let angle = 120 * Math.PI / 180;
        for (let k = 0; k < 6; k++) {
            posX = posX + Math.sin(angle) * size;
            posY = posY - Math.cos(angle) * size;
            angle = angle + 60 * Math.PI / 180;
            if (edges[k] === 0) {
                context.stroke();
                context.moveTo(posX, posY);
            } else {
                context.lineTo(posX, posY);
            }
        }
        if (fill) {
            context.closePath();
            context.fill();
        } else
            context.stroke();
    }

    draw(posX, posY, size, context, first) {
        if (first)
            this.hexagonPath(posX, posY, size, context, [1, 1, 1, 1, 1, 1], false);
        else
            this.hexagonPath(posX, posY, size, context, [1, 1, 1, 1, 0, 1], false);
    }

    fillTile(posX, posY, size, context, color) {
        context.fillStyle = color;
        this.hexagonPath(posX, posY, size, context, [1, 1, 1, 1, 1, 1], true);
    }
}