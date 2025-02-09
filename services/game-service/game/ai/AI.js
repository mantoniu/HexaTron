const {neighbour} = require("./AIUtils");
const {Player} = require("../Player");

class AI extends Player {
    constructor(id, name) {
        super(id, name);
        this.board = [];
        this.column = 0;
        this.row = 0;
        this.moves = ["HEAVY_LEFT", "LIGHT_LEFT", "KEEP_GOING", "LIGHT_RIGHT", "HEAVY_RIGHT", ""]; //Corresponding values [0, 1, 4, 7, 6, 2];
        this.dictMovesIndex = {0: 0, 1: 1, 4: 2, 7: 3, 6: 4, 2: 5};
        this._botPosition = [];
        this._opponentPosition = [];
        this.init = 5;
        this.previous = 0;
    }

    possiblePosition(position) {
        return this.board[position[0]][position[1]] === 0;
    }

    createBoard(rowSize, columnSize) {
        this.board = [];
        this.column = columnSize + 2;
        this.row = rowSize + 2;
        for (let i = 0; i <= rowSize + 1; i++) {
            let line = [];
            for (let j = 0; j <= (i % 2 === 1 ? columnSize + 1 : columnSize); j++) {
                if (i === 0 || i === rowSize + 1 || j === 0 || j >= (i % 2 === 1 ? columnSize + 1 : columnSize))
                    line.push(-1);
                else
                    line.push(0);
            }
            this.board.push(line);
        }
    }

    concentricPath(center, radius, operation) {
        let result = [];
        let hex = [center[0] + radius, center[1] - Math.floor((radius + center[0] % 2) / 2)];
        for (let side = 0; side < 6; side++) {
            for (let l = 0; l < radius; l++) {
                if (this.inGrid(hex)) {
                    const operationRes = operation(hex);
                    if (operationRes !== null) {
                        result.push(operationRes);
                    }
                }
                hex = neighbour(hex, side);
            }
        }
        return result;
    }

    inGrid(position) {
        return position[1] <= (position[0] % 2 === 0 ? this.column - 1 : this.column) && position[1] >= 0 && position[0] <= this.row && position[0] >= 0;
    }

    updatePlayerState(playersState) {
        this._botPosition = [playersState["playerPosition"]["row"], playersState["playerPosition"]["column"]];
        this._opponentPosition = [playersState["opponentPosition"]["row"], playersState["opponentPosition"]["column"]];
        this.board[this._botPosition[0]][this._botPosition[1]] = 1;
        this.board[this._opponentPosition[0]][this._opponentPosition[1]] = 2;
    }

    getMoveFromPosition(nextPosition) {
        let deltaPositions = [nextPosition[0] - this._botPosition[0], nextPosition[1] - this._botPosition[1]];
        let moveInActualConfiguration = (3 * deltaPositions[0] + deltaPositions[1]) + 3 + ((deltaPositions[0] !== 0 && this._botPosition[0] % 2 !== 0) ? 1 : 0);
        let indexMoveInDefaultConfiguration = ((this.dictMovesIndex[moveInActualConfiguration] + (this.init - this.previous)) + 6) % 6;

        this.previous = ((this.dictMovesIndex[moveInActualConfiguration] - 3) + 6) % 6;

        return this.moves[indexMoveInDefaultConfiguration];
    }
}

module.exports = AI;