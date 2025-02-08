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
let tree = {};
let round = 0;

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

function tabPosToGraph(position) {
    return position[0] * column + position[1];
}

function graphToTabPos(position) {
    return [~~(position / column), position % column];
}


function voronoiHeuristic(botPosition, opponentPosition) {
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
            for (let v of graph[queue[front]]) {
                if (!arg.includes(v)) {
                    if (!closer.hasOwnProperty(v)) {
                        queue.push(v);
                        closer[v] = [i, closer[queue[front]][1] + 1];
                        results[i]++;
                        tail++;
                    } else if (closer[v][1] > closer[queue[front]][1] + 1) {
                        queue.push(v);
                        results[closer[v][0]]--;
                        closer[v] = [i, closer[queue[front]][1] + 1];
                        results[i]++;
                        tail++;
                    } else if (closer[v][1] === closer[queue[front]][1] + 1 && closer[v][0] !== i) {
                        results[closer[v][0]]--;
                        closer[v] = [-1, 0];
                    }
                } else
                    sameComponent = sameComponent || v !== arg[i];
            }
            front++;
        }
    }
    return [results, sameComponent];
}

function miniMax(maxDepth) {
    let position = JSON.stringify([tabPosToGraph(_botPosition), tabPosToGraph(_opponentPosition)]);

    tree = {};
    tree[position] = {"Parent": null, "Childs": [], "Score": -Infinity, "Next Position": null, "Depth": 0, "Visited": 0};

    let queue = [position];
    let elementsToRestore = {};
    while (queue.length > 0) {
        // If the positions of both players are the same, it is not a good move.
        if (JSON.parse(queue[queue.length - 1])[0] === JSON.parse(queue[queue.length - 1])[1]) {
            tree[queue[queue.length - 1]].Score = ((tree[queue[queue.length - 1]].depth) % 2 === 0 ? Infinity : -Infinity);
            queue.pop();
        }
        // Otherwise, the children of the current node in the tree are created according to the possible positions around the current one to be evaluated.
        else if (tree[queue[queue.length - 1]].Depth !== maxDepth && tree[queue[queue.length - 1]].Visited < 1) {
            let depth = tree[queue[queue.length - 1]].Depth;

            let children = [...Array.from(graph[JSON.parse(queue[queue.length - 1])[depth % 2]]).map(
                el => {
                    if (depth % 2 === 0)
                        return JSON.stringify([el, JSON.parse(queue[queue.length - 1])[1]]);
                    else
                        return JSON.stringify([JSON.parse(queue[queue.length - 1])[0], el]);
                })
            ];

            for (const child of children) {
                tree[child] = {
                    "Parent": queue[queue.length - 1],
                    "Childs": [],
                    "Score": ((depth + 1) % 2 === 0 ? -Infinity : Infinity),
                    "Next Position": null,
                    "Depth": tree[queue[queue.length - 1]].Depth + 1,
                    "Visited": 0
                };
            }

            tree[queue[queue.length - 1]].Childs = children;
            tree[queue[queue.length - 1]].Visited = 1;

            // The neighbors of the current position are stored to restore the graph representation of the board's status later.
            elementsToRestore[JSON.parse(queue[queue.length - 1])[depth % 2]] = graph[JSON.parse(queue[queue.length - 1])[depth % 2]];

            // The current node's position is deleted from the graph representation of the board's status because, after this move, it is no longer accessible.
            for (const p of graph[JSON.parse(queue[queue.length - 1])[depth % 2]]) {
                graph[p].delete(JSON.parse(queue[queue.length - 1])[depth % 2]);
            }
            delete graph[JSON.parse(queue[queue.length - 1])[depth % 2]];
            queue = queue.concat(children);
        } else {

            if (tree[queue[queue.length - 1]].Depth === maxDepth) {
                tree[queue[queue.length - 1]].Score = evaluation(JSON.parse(queue[queue.length - 1]), tree[queue[queue.length - 1]].Depth);
            } else {
                for (const child of tree[queue[queue.length - 1]].Childs) {
                    if (tree[queue[queue.length - 1]].Depth % 2 === 0 && tree[queue[queue.length - 1]].Score < tree[child].Score) {
                        tree[queue[queue.length - 1]].Score = tree[child].Score;
                        tree[queue[queue.length - 1]]["Next Position"] = child;
                    } else if (tree[queue[queue.length - 1]].Depth % 2 === 1 && tree[queue[queue.length - 1]].Score > tree[child].Score) {
                        tree[queue[queue.length - 1]].Score = tree[child].Score;
                        tree[queue[queue.length - 1]]["Next Position"] = child;
                    }
                    delete tree[child];
                }

                // Restoration of the graph representing the board's status before the position was added to the tree.
                let restore = elementsToRestore[JSON.parse(queue[queue.length - 1])[tree[queue[queue.length - 1]].Depth % 2]];
                let key = JSON.parse(queue[queue.length - 1])[tree[queue[queue.length - 1]].Depth % 2];

                delete elementsToRestore[JSON.parse(queue[queue.length - 1])[tree[queue[queue.length - 1]].Depth % 2]];

                graph[key] = restore;
                for (const restoreKey of restore) {
                    graph[restoreKey].add(key);
                }
            }
            queue.pop();
        }

    }
    return JSON.parse(tree[position]["Next Position"]);
}

function evaluation(position) {
    let voronoiResult = voronoiHeuristic(graphToTabPos(position[0]), graphToTabPos(position[1]));
    return voronoiResult[0][0] - voronoiResult[0][1];
}

function updatePlayerState(playersState) {
    if (round > 1) {
        for (const position of [tabPosToGraph(_botPosition), tabPosToGraph(_opponentPosition)]) {
            for (const p of graph[position]) {
                graph[p].delete(position);
            }
            delete graph[position];
        }
    }
    _botPosition = [playersState["playerPosition"]["row"], playersState["playerPosition"]["column"]];
    _opponentPosition = [playersState["opponentPosition"]["row"], playersState["opponentPosition"]["column"]];
    board[_botPosition[0]][_botPosition[1]] = 1;
    board[_opponentPosition[0]][_opponentPosition[1]] = 2;
}

function getNextMove() {
    let resMinimax = miniMax(5);
    if (resMinimax === null) {
        return "KEEP_GOING";
    }
    let nextPosition = graphToTabPos(resMinimax[0]);
    let deltaPositions = [nextPosition[0] - _botPosition[0], nextPosition[1] - _botPosition[1]];
    let moveInActualConfiguration = (3 * deltaPositions[0] + deltaPositions[1]) + 3 + ((deltaPositions[0] !== 0 && _botPosition[0] % 2 !== 0) ? 1 : 0);
    let indexMoveInDefaultConfiguration = ((dictMovesIndex[moveInActualConfiguration] + (init - previous)) + 6) % 6;

    previous = ((dictMovesIndex[moveInActualConfiguration] - 3) + 6) % 6;

    return moves[indexMoveInDefaultConfiguration];
}

export function setup(playersState) {
    return new Promise((resolve) => {
        round = 0;
        createBoard(9, 16);
        createGraph();
        updatePlayerState(playersState);
        previous = (_botPosition[1] % 16 === 0 ? 2 : 5);
        resolve(true);
    });
}

export function nextMove(playersState) {
    return new Promise((resolve) => {
        round++;
        updatePlayerState(playersState);
        let nextMove = getNextMove();
        resolve(nextMove);
    });
}
