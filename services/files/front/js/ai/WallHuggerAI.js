import { AI } from "./AI.js";
import { Directions, DISPLACEMENT_FUNCTIONS } from "../GameUtils.js";

class Tree {
    constructor(positions) {
        this._positions = {};
        this._children = [];
        this._score = 0;
    }

    get score() {
        return this._score;
    }

    set score(score) {
        return this._score;
    }

    get positions() {
        return this._positions;
    }

    get children() {
        return this._children;
    }

    set children(children) {
        this._children = children;
    }
}

export class WallHuggerAI extends AI {

    constructor(id, name, color, playersState) {
        super(id, name, color, "../../assets/bot.svg", false);
        this.tree = null;
        this.moves = ["HEAVY_LEFT", "LIGHT_LEFT", "KEEP_GOING", "LIGHT_RIGHT", "HEAVY_RIGHT"];
        this.tabMoves = [0, 1, 4, 7, 6];
        this.mapTest = {
            6: Directions.LOWER_LEFT,
            0: Directions.UPPER_LEFT,
            1: Directions.UPPER_RIGHT,
            7: Directions.LOWER_RIGHT,
            2: Directions.LEFT,
            4: Directions.RIGHT
        };
    }

    updatePlayerState(playersState) {
        this.botPosition = [playersState["playerPosition"]["row"], playersState["playerPosition"]["column"]];
        this.opponentPosition = [playersState["opponentPosition"]["row"], playersState["opponentPosition"]["column"]];
        this.board[this.botPosition[0]][this.botPosition[1]] = 1;
        this.board[this.opponentPosition[0]][this.opponentPosition[1]] = 2;
    }

    neighbour(position, side) {
        return DISPLACEMENT_FUNCTIONS[side](position);
    }

    concentricPath(center, radius, operation) {
        console.log(this.board);
        let result = [];
        let hex = [center[0] + radius, center[1] - Math.floor((radius + center[0] % 2) / 2)];
        for (let side = 0; side < 6; side++) {
            for (let l = 0; l < radius; l++) {
                console.log(hex, this.inGrid(hex), operation(hex), "test");
                if (this.inGrid(hex)) {
                    var operationRes = operation(hex);
                    if (operationRes !== null)
                        result.push(operationRes);
                }
                hex = this.neighbour(hex, side);
            }
        }
        //console.log(result,"Circle",center)
        return result;
    }

    wallAround(position) {
        return this.concentricPath(position, 1, (p) => {
            if (this.board[p[0]][p[1]] !== 0 && this.board[p[0]][p[1]] !== 1) return p;
            return null;
        }).length !== 0;
    }

    possiblePosition(position) {
        //console.log(position[1]<=16 && position[1]>=1 && position[0]<=9 && position[0]>=1 && this.board[position[0]][position[1]] === 0)
        return this.board[position[0]][position[1]] === 0;
    }

    inGrid(position) {
        return position[1] <= (position[0] % 2 === 0 ? this._column - 1 : this._column) && position[1] >= 0 && position[0] <= this._row && position[0] >= 0;
    }

    WallsHeuristic() {
        //let possible = this.possiblePosition(this.botPosition)
        console.log(this.concentricPath(this.botPosition, 1, (x) => {
            if (this.possiblePosition(x)) return x;
            return null;
        }), "Possible");
        let withWall = this.concentricPath(this.botPosition, 1, (x) => {
            if (this.possiblePosition(x) && this.wallAround(x)) return x;
            return null;
        });
        console.log(withWall, Math.random() * (withWall.length), withWall.length, "Walls");
        if (withWall.length !== 0)
            return withWall[Math.floor(Math.random() * (withWall.length))];
        else
            return DISPLACEMENT_FUNCTIONS[Math.floor(Math.random() * DISPLACEMENT_FUNCTIONS.length)](this.botPosition);
    }

    getNextMove() {
        let nextPosition = this.WallsHeuristic();
        let p = [nextPosition[0] - this.botPosition[0], nextPosition[1] - this.botPosition[1]];
        let c = (3 * p[0] + p[1]) + 3;
        //return this.moves[c+(this.init-this.previous+6)%6]
        return nextPosition;
    }

    createBoard(row, column) {
        this.board = [];
        this._column = column + 2;
        this._row = row + 2;
        for (let i = 0; i <= row + 1; i++) {
            let line = [];
            for (let j = 0; j <= (i % 2 === 1 ? column + 1 : column); j++) {
                if (i === 0 || i === row + 1 || j === 0 || j >= (i % 2 === 1 ? column + 1 : column))
                    line.push(-1);
                else
                    line.push(0);
            }
            this.board.push(line);
        }
    }


    setup(playersState) {
        this.createBoard(9, 16);
        this.updatePlayerState(playersState);
        console.log(this.botPosition, "start");
        this.previous = this.botPosition[0] === 16 ? 2 : 4;
        //bot = new WallHuggerBot('1','Bot 1', 'red',playersState);
    }

    nextMove(playersState) {
        this.updatePlayerState(playersState);
        let nextPos = this.getNextMove();
        let delta = [nextPos[0] - this.botPosition[0], nextPos[1] - this.botPosition[1]];
        let result = delta[0] * 3 + delta[1] + 3 + ((delta[0] !== 0 && this.botPosition[0] % 2 !== 0) ? 1 : 0);
        console.log(this.botPosition, nextPos, result, this.mapTest[result]);
        return this.mapTest[result];
    }
}


/*
export function setup(playersState){
    return new Promise((resolve)=>{
        this.updatePlayerState(playersState)
        this.init = this.botPosition[0] === 16 ? 2 : 4
        this.previous = this.init;
        //bot = new WallHuggerBot('1','Bot 1', 'red',playersState);
        resolve(true);
    })
}

export function nextMove(playersState){
    return new Promise((resolve)=>{
        resolve(bot.getNextMove(playersState));
    })
}*/
