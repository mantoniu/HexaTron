import {AI} from "./AI.js";
import {DISPLACEMENT_FUNCTIONS, neighbour} from "./AIUtils.js";

export class WallHuggerAI extends AI {
    constructor(id, name, color) {
        super(id, name, color, "../../assets/bot.svg", false);
    }

    wallAround(position) {
        return this.concentricPath(position, 1, (p) => {
            if (this.board[p[0]][p[1]] !== 0 && this.board[p[0]][p[1]] !== 1) return p;
            return null;
        }).length;
    }

    maxWallsHeuristic() {
        let hex = [this._botPosition[0] + 1, this._botPosition[1] - Math.floor((1 + this._botPosition[0] % 2) / 2)];
        let max = 0;
        let res = null;
        for (let side = 0; side < 6; side++) {
            if (this.inGrid(hex) && this.possiblePosition(hex)) {
                let nbWall = this.wallAround(hex);
                if (nbWall >= max) {
                    res = hex;
                    max = nbWall;
                }
            }
            hex = neighbour(hex, side);
        }
        if (res !== null) {
            return res;
        } else {
            //If the bot arrive it this situation, it is surrounded and can't move anymore
            return DISPLACEMENT_FUNCTIONS[(this.previous + 3) % 6](this._botPosition);
        }
    }

    getNextMove() {
        return this.getMoveFromPosition(this.maxWallsHeuristic());
    }


    setup(playersState) {
        return new Promise((resolve) => {
            this.createBoard(9, 16);
            this.updatePlayerState(playersState);
            this.previous = (this._botPosition[1] % 16 === 0 ? 2 : 5);
            resolve(true);
        });
    }

    nextMove(playersState) {
        return new Promise((resolve) => {
            this.updatePlayerState(playersState);
            let nextMove = this.getNextMove();
            resolve(nextMove);
        });
    }
}