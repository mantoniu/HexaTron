export const Status = {
    Wall: -1,
    Vacant: 0,
    Taken: 1
};

export class Tile {
    constructor(status) {
        this.status = status;
        this.takenID = "";
    }

    get takenID() {
        if (this.status !== Status.Taken) throw new Error("The Tile is not taken by a player");
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

    hexagonPath(posX, posY, size, context) {
        context.beginPath();
        let angle = 120 * Math.PI / 180;
        for (let k = 0; k < 6; k++) {
            context.lineTo(posX + Math.sin(angle) * size, posY - Math.cos(angle) * size);
            angle = angle - 60 * Math.PI / 180;
        }
        context.closePath();
    }

    draw(posX, posY, size, context) {
        this.hexagonPath(posX, posY, size, context);
        context.stroke();
    }

    fillTile(posX, posY, size, context, color) {
        context.fillStyle = color;
        this.hexagonPath(posX, posY, size, context);
        context.fill();
    }
}