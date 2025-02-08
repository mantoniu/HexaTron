let moves = ["HEAVY_LEFT", "LIGHT_LEFT", "KEEP_GOING", "LIGHT_RIGHT", "HEAVY_RIGHT", ""]; //Corresponding values [0, 1, 4, 7, 6, 2];
let dictMovesIndex = {0: 0, 1: 1, 4: 2, 7: 3, 6: 4, 2: 5};
let botPosition = [];
let opponentPosition = [];
let board = [];
let column = 0;
let row = 0;
const init = 5;
let previous = 0;

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


function updatePlayerState(playersState) {
    botPosition = [playersState["playerPosition"]["row"], playersState["playerPosition"]["column"]];
    opponentPosition = [playersState["opponentPosition"]["row"], playersState["opponentPosition"]["column"]];
    board[botPosition[0]][botPosition[1]] = 1;
    board[opponentPosition[0]][opponentPosition[1]] = 2;
}

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

function wallAround(position) {
    return concentricPath(position, 1, (p) => {
        if (board[p[0]][p[1]] !== 0 && board[p[0]][p[1]] !== 1) return p;
        return null;
    }).length;
}

function possiblePosition(position) {
    return board[position[0]][position[1]] === 0;
}

function inGrid(position) {
    return position[1] <= (position[0] % 2 === 0 ? column - 1 : column) && position[1] >= 0 && position[0] <= row && position[0] >= 0;
}

function maxWallsHeuristic() {
    let hex = [botPosition[0] + 1, botPosition[1] - Math.floor((1 + botPosition[0] % 2) / 2)];
    let max = 0;
    let res = null;
    for (let side = 0; side < 6; side++) {
        if (inGrid(hex) && possiblePosition(hex)) {
            let nbWall = wallAround(hex);
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
        return DISPLACEMENT_FUNCTIONS[(previous + 3) % 6](botPosition);
    }
}

function getNextMove() {
    let nextPosition = maxWallsHeuristic();
    let deltaPositions = [nextPosition[0] - botPosition[0], nextPosition[1] - botPosition[1]];
    let moveInActualConfiguration = (3 * deltaPositions[0] + deltaPositions[1]) + 3 + ((deltaPositions[0] !== 0 && botPosition[0] % 2 !== 0) ? 1 : 0);
    let indexMoveInDefaultConfiguration = ((dictMovesIndex[moveInActualConfiguration] + (init - previous)) + 6) % 6;
    previous = ((dictMovesIndex[moveInActualConfiguration] - 3) + 6) % 6;
    console.log(botPosition, nextPosition, moves[indexMoveInDefaultConfiguration]);
    return moves[indexMoveInDefaultConfiguration];
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


export function setup(playersState) {
    return new Promise((resolve) => {
        createBoard(9, 16);
        updatePlayerState(playersState);
        previous = (botPosition[1] % 16 === 0 ? 2 : 5);
        resolve(true);
    });
}

export function nextMove(playersState) {
    return new Promise((resolve) => {
        updatePlayerState(playersState);
        let nextMove = getNextMove();
        resolve(nextMove);
    });
}

/*
exports.setup = setup;
exports.nextMove = nextMove;
 */