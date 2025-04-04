import {Directions} from "./GameUtils.js";

export const Status = {
    WALL: -1,
    VACANT: 0,
    TAKEN: 1
};

export class Tile {
    static bikeImage = null;
    static imageLoaded = true;

    constructor(status, backgroundResetColor) {
        this.status = status;
        this.takenID = null;
        this._backgroundResetColor = backgroundResetColor;
        this.animationsId = [];

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

    lineTo(context, posX, posY, angle, size) {
        posX = posX + Math.sin(angle) * size;
        posY = posY - Math.cos(angle) * size;
        angle = angle + 60 * Math.PI / 180;
        context.lineTo(posX, posY);
        return [posX, posY, angle];
    }

    hexagonPath(posX, posY, size, context, edges, fillColor) {
        let angle = 120 * Math.PI / 180;
        for (let k = 0; k < 6; k++) {
            if (edges?.[k]) {
                context.beginPath();
                context.moveTo(posX, posY);
                [posX, posY, angle] = this.lineTo(context, posX, posY, angle, size);
                context.strokeStyle = edges[k];
                context.stroke();
            }
        }

        context.beginPath();

        for (let k = 0; k < 6; k++) {
            [posX, posY, angle] = this.lineTo(context, posX, posY, angle, size);
        }

        context.closePath();
        context.fillStyle = fillColor;
        context.fill();
    }

    fill(position, size, context, strokeColors, fillColor, direction = null, drawBike = null, gradientBool = false, finalState = false) {
        if (gradientBool) {
            let progress = 0;
            const maxFrames = 120;
            const animateGradient = () => {
                context.save();

                context.lineWidth = 4;
                context.lineWidth -= 1;
                this.hexagonPath(position[0], position[1], size, context, Array(6).fill(this._backgroundResetColor), this._backgroundResetColor);
                context.lineWidth += 1;

                const gradient = context.createRadialGradient(
                    position[0], position[1] + size, 0,
                    position[0], position[1] + size, size
                );

                gradient.addColorStop(0, `${fillColor}${this.convertToHexa(Math.min(0.12 + progress, 1))}`);     // Transparent cyan au centre
                gradient.addColorStop(0.3, `${fillColor}${this.convertToHexa(Math.min(0.3 + progress, 1))}`); // Cyan semi-transparent
                gradient.addColorStop(1, `${fillColor}${this.convertToHexa(Math.min(0.5 + progress, 1))}`);

                const copy = strokeColors.map(color => `${color}${this.convertToHexa(Math.min(0.5 + progress, 1))}`);

                this.hexagonPath(position[0], position[1], size, context, copy, gradient);
                context.restore();

                if (finalState) {
                    progress += 1 / maxFrames;
                    if (progress <= 1)
                        this.animationsId.push(requestAnimationFrame(animateGradient));
                }
            }
            animateGradient();
        } else
            this.hexagonPath(position[0], position[1], size, context, strokeColors, fillColor);

        if (drawBike)
            this.drawBike(position[0], position[1], size, context, direction);
    }

    convertToHexa(value) {
        return Math.round(value * 255).toString(16).padStart(2, "0").toUpperCase();
    }

    refreshTile(status) {
        this.animationsId.forEach(id => cancelAnimationFrame(id));
        this._status = status;
    }
}