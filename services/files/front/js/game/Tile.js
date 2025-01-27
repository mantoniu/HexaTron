import {Directions} from "./GameUtils.js";

export const Status = {
    WALL: -1,
    VACANT: 0,
    TAKEN: 1
};

export class Tile {
    static bikeImage = null;
    static imageLoaded = true;

    constructor(status) {
        this.status = status;
        this.takenID = null;

        Tile.loadImage();
    }

    static loadImage() {
        if (!Tile.bikeImage) {
            Tile.bikeImage = new Image();
            Tile.bikeImage.src = "../../assets/space-ship.svg";
            Tile.bikeImage.onload = () => Tile.imageLoaded = true;
            Tile.bikeImage.onerror = () => console.error("Failed to load the bike image.");
        }
    }

    drawBike(posX, posY, size, context, direction) {
        if (!Tile.bikeImage.complete || !Tile.imageLoaded) return;

        context.save();
        context.translate(posX, posY + size);

        const rotationAngles = {
            [Directions.UPPER_LEFT]: -Math.PI / 6,
            [Directions.UPPER_RIGHT]: Math.PI / 6,
            [Directions.RIGHT]: Math.PI / 2,
            [Directions.LOWER_RIGHT]: Math.PI - Math.PI / 6,
            [Directions.LOWER_LEFT]: -Math.PI + Math.PI / 6,
            [Directions.LEFT]: -Math.PI / 2
        };

        context.rotate(rotationAngles[direction]);

        context.drawImage(
            Tile.bikeImage,
            -size / 2,
            -size / 2,
            size,
            size
        );

        context.restore();
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

    fill(position, size, context, color, direction, drawBike) {
        context.fillStyle = color;
        this.hexagonPath(position[0], position[1], size, context, [1, 1, 1, 1, 1, 1], true);

        if (drawBike)
            this.drawBike(position[0], position[1], size, context, direction);
    }
}