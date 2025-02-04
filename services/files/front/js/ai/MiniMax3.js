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

        if (nbWall > max) {
            //console.log(hex, max, this.wallAround(hex), "NEW POTENTIALLY POS");
            res.push(graphToTabPos(hex));
            max = nbWall;
        }
    }
    if (res.length !== 0) {
        console.log("NOT RANDOM");
        return res[0];
    } else {
        console.log("RANDOM");
        //If the bot arrive it this situation, it is surrounded and can't move anymore
        return [DISPLACEMENT_FUNCTIONS[(previous + 3) % 6](_botPosition)][0];
    }
}

function voronoiHeuristic(botPosition, opponentPosition) {
    //console.log(graph, "Start Voronoi");
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
        //console.log(queue,graph,queue[front],"test")
        while (front !== tail) {
            //console.log(i,front,queue[front], structuredClone(graph), closer[queue[front]][1] + 1,"Voronoi")
            for (let v of graph[queue[front]]) {
                if (!arg.includes(v)) {
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
                } else
                    sameComponent = sameComponent || v !== arg[i];
            }
            front++;
        }
    }
    localStorage.setItem("result_voronoi", JSON.stringify(closer));
    //console.log(graph);
    localStorage.setItem("graph", JSON.stringify(graph));
    localStorage.setItem("samecomponent", sameComponent);
    //console.log(closer,"Closer")

    //console.log(results,"End Voronoi")
    return [results, sameComponent];
}

function miniMax(maxDepth) {
    let position = JSON.stringify([tabPosToGraph(_botPosition), tabPosToGraph(_opponentPosition)]);

    tree = {};
    tree[position] = {"Parent": null, "Childs": [], "Score": -Infinity, "Next Position": null, "Depth": 0, "Visited": 0};

    let queue = [position];
    let elementsToRestore = {};
    //console.log(position,structuredClone(tree),structuredClone(graph),...queue)
    while (queue.length > 0) {
        //console.log(queue, tree)
        //console.log(queue[queue.length-1])
        if (JSON.parse(queue[queue.length - 1])[0] === JSON.parse(queue[queue.length - 1])[1]) {
            tree[queue[queue.length - 1]].Score = ((tree[queue[queue.length - 1]].depth) % 2 === 0 ? Infinity : -Infinity);
            queue.pop();
        } else if (tree[queue[queue.length - 1]].Depth !== maxDepth && tree[queue[queue.length - 1]].Visited < 1) { // &&  graph[JSON.parse(queue[queue.length-1])[tree[queue[queue.length-1]].Depth%2]].length !== 0){

            let depth = tree[queue[queue.length - 1]].Depth;

            //console.log(graph,queue[queue.length-1],"CHILD")
            let children = [...Array.from(graph[JSON.parse(queue[queue.length - 1])[depth % 2]]).map(
                el => {
                    if (depth % 2 === 0)
                        return JSON.stringify([el, JSON.parse(queue[queue.length - 1])[1]]);
                    else
                        return JSON.stringify([JSON.parse(queue[queue.length - 1])[0], el]);
                })
            ];
            //console.log(children,"CHILD2")
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


            //console.log(queue[queue.length-1],queue)
            elementsToRestore[JSON.parse(queue[queue.length - 1])[depth % 2]] = graph[JSON.parse(queue[queue.length - 1])[depth % 2]];
            for (const p of graph[JSON.parse(queue[queue.length - 1])[depth % 2]]) {
                //console.log(p,structuredClone(graph),...queue,depth, "DELETE CHILDS")
                graph[p].delete(JSON.parse(queue[queue.length - 1])[depth % 2]);
            }
            //console.log(JSON.parse(queue[queue.length-1])[depth%2],queue[queue.length-1],elementsToRestore[JSON.parse(queue[queue.length-1])[depth%2]],"DELETE")
            delete graph[JSON.parse(queue[queue.length - 1])[depth % 2]];
            //console.log(JSON.parse(queue[queue.length-1])[depth%2],structuredClone(graph),depth, "DELETE")
            queue = queue.concat(children);
        } else {

            if (tree[queue[queue.length - 1]].Depth === maxDepth) {//} || graph[JSON.parse(queue[queue.length-1])[tree[queue[queue.length-1]].Depth%2]] === 0){
                tree[queue[queue.length - 1]].Score = evaluation(JSON.parse(queue[queue.length - 1]), tree[queue[queue.length - 1]].Depth);

            } else {

                for (const child of tree[queue[queue.length - 1]].Childs) {
                    //console.log(structuredClone(tree),tree[queue[queue.length-1]].Childs, child,"test")
                    if (tree[queue[queue.length - 1]].Depth % 2 === 0 && tree[queue[queue.length - 1]].Score < tree[child].Score) {
                        tree[queue[queue.length - 1]].Score = tree[child].Score;
                        tree[queue[queue.length - 1]]["Next Position"] = child;
                    } else if (tree[queue[queue.length - 1]].Depth % 2 === 1 && tree[queue[queue.length - 1]].Score > tree[child].Score) {
                        tree[queue[queue.length - 1]].Score = tree[child].Score;
                        tree[queue[queue.length - 1]]["Next Position"] = child;
                    }
                    delete tree[child];
                }


                //console.log(tree[queue[queue.length-1]],queue[queue.length-1],JSON.parse(queue[queue.length-1])[tree[queue[queue.length-1]].Depth%2],elementsToRestore,"To RESTORE")
                let restore = elementsToRestore[JSON.parse(queue[queue.length - 1])[tree[queue[queue.length - 1]].Depth % 2]];
                delete elementsToRestore[JSON.parse(queue[queue.length - 1])[tree[queue[queue.length - 1]].Depth % 2]];
                let key = JSON.parse(queue[queue.length - 1])[tree[queue[queue.length - 1]].Depth % 2];
                graph[key] = restore;
                for (const restoreKey of restore) {
                    //console.log(restoreKey,...graph[restoreKey],"RESTORATION CHILD")
                    graph[restoreKey].add(key);
                }
                //console.log(key,restore,"restauration")
            }
            queue.pop();
        }

    }
    //console.log(tree,JSON.parse(tree[position]["Next Position"]),"MINIMAX")
    return JSON.parse(tree[position]["Next Position"]);
}

function evaluation(position, depth) {
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
    let resMinimax = miniMax(7);
    console.log(resMinimax);
    let nextPosition = graphToTabPos(resMinimax[0]);

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
        round = 0;
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
        round++;
        updatePlayerState(playersState);
        let nextMove = getNextMove();
        resolve(nextMove);
    });
}

/*
exports.setup = setup;
exports.nextMove = nextMove;
 */