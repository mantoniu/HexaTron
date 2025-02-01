let moves = ["HEAVY_LEFT", "LIGHT_LEFT", "KEEP_GOING", "LIGHT_RIGHT", "HEAVY_RIGHT", ""]; //Corresponding values [0, 1, 4, 7, 6, 2];
let dictMovesIndex = {0: 0, 1: 1, 4: 2, 7: 3, 6: 4, 2: 5};
let _botPosition = [];
let _opponentPosition = [];
let board = [];
let column = 0;
let row = 0;
const init = 5;
let previous = 0;
let graph = {};

class Tree {
    constructor(positions) {
        this._positions = positions;
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

function getUpperLeftPosition(position) {
    return [
        position[0] - 1,
        position[0] % 2 === 0 ? position[1] : position[1] - 1
    ];
}

function getUpperRightPosition(position) {
    return [
        position[0] - 1,
        position[0] % 2 === 0 ? position[1] + 1 : position[1]
    ];
}

function getLeftPosition(position) {
    return [
        position[0],
        position[1] - 1
    ];
}

function getRightPosition(position) {
    return [
        position[0],
        position[1] + 1
    ];
}

function getLowerLeftPosition(position) {
    return [
        position[0] + 1,
        position[0] % 2 === 0 ? position[1] : position[1] - 1
    ];
}

function getLowerRightPosition(position) {
    return [
        position[0] + 1,
        position[0] % 2 === 0 ? position[1] + 1 : position[1]
    ];
}

const DISPLACEMENT_FUNCTIONS = [
    getUpperLeftPosition,
    getUpperRightPosition,
    getRightPosition,
    getLowerRightPosition,
    getLowerLeftPosition,
    getLeftPosition
];


function neighbour(position, side) {
    return DISPLACEMENT_FUNCTIONS[side](position);
}

function concentricPath(center, radius, operation) {
    let result = [];
    let hex = [center[0] + radius, center[1] - Math.floor((radius + center[0] % 2) / 2)];
    for (let side = 0; side < 6; side++) {
        for (let l = 0; l < radius; l++) {
            if (inGrid(hex)) {
                var operationRes = operation(hex);
                if (operationRes !== null) {
                    result.push(operationRes);
                }
            }
            hex = neighbour(hex, side);
        }
    }
    return result;
}

function possiblePosition(position) {
    return board[position[0]][position[1]] === 0;
}

function inGrid(position) {
    return position[1] <= (position[0] % 2 === 0 ? column - 1 : column) && position[1] >= 0 && position[0] <= row && position[0] >= 0;
}

function createBoard(rowSize, columnSize) {
    board = [];
    column = columnSize + 2;
    row = rowSize + 2;
    for (let i = 0; i <= rowSize + 1; i++) {
        let line = [];
        for (let j = 0; j <= (i % 2 === 1 ? columnSize + 1 : columnSize); j++) {
            if (i === 0 || i === rowSize + 1 || j === 0 || j >= (i % 2 === 1 ? columnSize + 1 : columnSize))
                line.push(-1);
            else
                line.push(0);
        }
        board.push(line);
    }
}

function createGraph() {
    graph = {};
    for (let i = 1; i <= row - 2; i++) {
        for (let j = 1; j <= (i % 2 === 1 ? column - 2 : column - 3); j++) {
            graph[i * column + j] = new Set(concentricPath([i, j], 1, (p) => possiblePosition(p) ? p[0] * column + p[1] : null));
        }
    }
}

function wallAroundInGraph(position) {
    return 6 - graph[position].size;
}

function tabPosToGraph(position) {
    return position[0] * column + position[1];
}

function graphToTabPos(position) {
    return [~~(position / column), position % column];
}


function maxWallsHeuristic(position) {
    console.log(_botPosition, "POS");
    //let hex = [this.botPosition[0] + 1, this.botPosition[1] - Math.floor((1 + this.botPosition[0] % 2) / 2)];
    let max = 0;
    let res = [];
    for (let hex of graph[tabPosToGraph(position)]) {
        console.log(hex);
        let nbWall = wallAroundInGraph(hex);
        if (nbWall > max) {
            //console.log(hex, max, this.wallAround(hex), "NEW POTENTIALLY POS");
            res = [graphToTabPos(hex)];
            max = nbWall;
        }
        //TODO modify this part
        if (nbWall > max) {
            //console.log(hex, max, this.wallAround(hex), "NEW POTENTIALLY POS");
            res.push(graphToTabPos(hex));
            max = nbWall;
        }
    }
    //TODO check if wall = real wall / opponent streak or bot streak and adapt behavior
    if (res.length !== 0) {
        console.log("NOT RANDOM");
        return res;
    } else {
        console.log("RANDOM");
        //If the bot arrive it this situation, it is surrounded and can't move anymore
        return [DISPLACEMENT_FUNCTIONS[(previous + 3) % 6](_botPosition)];
    }
}

function voronoiHeuristic(botPosition, opponentPosition) {
    console.log(graph, "Start Voronoi");
    let sameComponent = false;
    let results = [0, 0];
    let closer = {};
    let arg = [tabPosToGraph(botPosition), tabPosToGraph(opponentPosition)];
    for (let i = 0; i < arg.length; i++) {
        if (closer.hasOwnProperty(arg[i])) {
            results[closer[arg[i]][0]]--;
        }
        closer[arg[i]] = [i, 0];
        let front = 0;
        let tail = 1;
        let queue = [arg[i]];
        while (front !== tail) {
            if (queue[front] === arg[(i + 1) % arg.length])
                sameComponent = true;
            //console.log(i,front,queue[front], graph[queue[front]], closer[queue[front]][1] + 1 )
            for (let v of graph[queue[front]]) {
                if (v !== arg[i]) {
                    if (!closer.hasOwnProperty(v)) {
                        queue.push(v);
                        closer[v] = [i, closer[queue[front]][1] + 1];
                        //console.log("First")
                        results[i]++;
                        tail++;
                    } else if (closer[v][1] > closer[queue[front]][1] + 1) {
                        //console.log("Changement")
                        queue.push(v);
                        results[closer[v][0]]--;
                        closer[v] = [i, closer[queue[front]][1] + 1];
                        results[i]++;
                        tail++;
                    } else if (closer[v][1] === closer[queue[front]][1] + 1 && closer[v][0] !== i) {
                        results[closer[v][0]]--;
                        closer[v] = [-1, 0];
                    }
                    //console.log(v,closer[v],closer[queue[front]][1] + 1)
                }
            }
            front++;
        }
    }
    localStorage.setItem("result_voronoi", JSON.stringify(closer));
    console.log(graph);
    localStorage.setItem("graph", JSON.stringify(graph));
    //console.log(closer,"Closer")

    //console.log(results,"End Voronoi")
    return [results, sameComponent];
}

function updatePlayerState(playersState) {
    _botPosition = [playersState["playerPosition"]["row"], playersState["playerPosition"]["column"]];
    _opponentPosition = [playersState["opponentPosition"]["row"], playersState["opponentPosition"]["column"]];
    board[_botPosition[0]][_botPosition[1]] = 1;
    board[_opponentPosition[0]][_opponentPosition[1]] = 2;

    for (const position of [tabPosToGraph(_botPosition), tabPosToGraph(_opponentPosition)]) {
        for (const p of graph[position]) {
            graph[p].delete(position);
        }
    }
}

function getNextMove() {
    let nextPosition = maxWallsHeuristic(_botPosition)[0];
    let voronoi = voronoiHeuristic(_botPosition, _opponentPosition);
    let deltaPositions = [nextPosition[0] - _botPosition[0], nextPosition[1] - _botPosition[1]];
    let moveInActualConfiguration = (3 * deltaPositions[0] + deltaPositions[1]) + 3 + ((deltaPositions[0] !== 0 && _botPosition[0] % 2 !== 0) ? 1 : 0);
    let indexMoveInDefaultConfiguration = ((dictMovesIndex[moveInActualConfiguration] + (init - previous)) + 6) % 6;
    previous = ((dictMovesIndex[moveInActualConfiguration] - 3) + 6) % 6;
    return moves[indexMoveInDefaultConfiguration];
}

/*    getNextMove() {
        let nextPositions = this.maxWallsHeuristic(this.botPosition);
        let nextPosition = 0;
        if (nextPositions.length !== 1) {
            let mini = 16 * 9;
            for (let pos in nextPositions) {
                let res = this.voronoiHeuristic(this.tabPosToGraph(this.botPosition), this.tabPosToGraph(this.opponentPosition));
                if (res[0][1] <= mini) {
                    nextPosition = pos;
                    mini = res[0][1];
                }
            }
        } else
            nextPosition = nextPositions[0];


        let p = [nextPosition[0] - this.botPosition[0], nextPosition[1] - this.botPosition[1]];
        let c = (3 * p[0] + p[1]) + 3;
        //return this.moves[c+(this.init-this.previous+6)%6]
        return nextPosition;
    }
 */


export function setup(playersState) {
    return new Promise((resolve) => {
        createBoard(9, 16);
        createGraph();
        updatePlayerState(playersState);
        previous = (_botPosition[1] % 16 === 0 ? 2 : 5);
        resolve(true);
    });
}

export function nextMove(playersState) {
    console.log("Next Round");
    return new Promise((resolve) => {
        updatePlayerState(playersState);
        resolve(getNextMove());
    });
}

/*
exports.setup = setup;
exports.nextMove = nextMove;
 */