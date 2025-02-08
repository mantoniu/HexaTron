export class MiniMaxClass {

    constructor() {
        this.moves = ["HEAVY_LEFT", "LIGHT_LEFT", "KEEP_GOING", "LIGHT_RIGHT", "HEAVY_RIGHT", ""]; //Corresponding values [0, 1, 4, 7, 6, 2];
        this.dictMovesIndex = {0: 0, 1: 1, 4: 2, 7: 3, 6: 4, 2: 5};
        this._botPosition = [];
        this._opponentPosition = [];
        this.board = [];
        this.column = 0;
        this.row = 0;
        this.init = 5;
        this.previous = 0;
        this.graph = {};
        this.tree = {};
        this.round = 0;
        this.DISPLACEMENT_FUNCTIONS = [
            this.getUpperLeftPosition,
            this.getUpperRightPosition,
            this.getRightPosition,
            this.getLowerRightPosition,
            this.getLowerLeftPosition,
            this.getLeftPosition
        ];
    }


    getUpperLeftPosition(position) {
        return [
            position[0] - 1,
            position[0] % 2 === 0 ? position[1] : position[1] - 1
        ];
    }

    getUpperRightPosition(position) {
        return [
            position[0] - 1,
            position[0] % 2 === 0 ? position[1] + 1 : position[1]
        ];
    }

    getLeftPosition(position) {
        return [
            position[0],
            position[1] - 1
        ];
    }

    getRightPosition(position) {
        return [
            position[0],
            position[1] + 1
        ];
    }

    getLowerLeftPosition(position) {
        return [
            position[0] + 1,
            position[0] % 2 === 0 ? position[1] : position[1] - 1
        ];
    }

    getLowerRightPosition(position) {
        return [
            position[0] + 1,
            position[0] % 2 === 0 ? position[1] + 1 : position[1]
        ];
    }

    neighbour(position, side) {
        return this.DISPLACEMENT_FUNCTIONS[side](position);
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
                hex = this.neighbour(hex, side);
            }
        }
        return result;
    }

    possiblePosition(position) {
        return this.board[position[0]][position[1]] === 0;
    }

    inGrid(position) {
        return position[1] <= (position[0] % 2 === 0 ? this.column - 1 : this.column) && position[1] >= 0 && position[0] <= this.row && position[0] >= 0;
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

    createGraph() {
        this.graph = {};
        for (let i = 1; i <= this.row - 2; i++) {
            for (let j = 1; j <= (i % 2 === 1 ? this.column - 2 : this.column - 3); j++) {
                this.graph[i * this.column + j] = new Set(this.concentricPath([i, j], 1, (p) => this.possiblePosition(p) ? p[0] * this.column + p[1] : null));
            }
        }
    }

    tabPosToGraph(position) {
        return position[0] * this.column + position[1];
    }

    graphToTabPos(position) {
        return [~~(position / this.column), position % this.column];
    }


    voronoiHeuristic(botPosition, opponentPosition) {
        let sameComponent = false;
        let results = [0, 0];
        let closer = {};
        let arg = [this.tabPosToGraph(botPosition), this.tabPosToGraph(opponentPosition)];

        for (let i = 0; i < arg.length; i++) {
            if (closer.hasOwnProperty(arg[i])) {
                results[closer[arg[i]][0]]--;
            }
            closer[arg[i]] = [i, 0];

            let front = 0;
            let tail = 1;
            let queue = [arg[i]];

            while (front !== tail) {
                for (let v of this.graph[queue[front]]) {
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

    miniMax(maxDepth) {
        let position = JSON.stringify([this.tabPosToGraph(this._botPosition), this.tabPosToGraph(this._opponentPosition)]);

        if (this.concentricPath(this._botPosition, 1, this.possiblePosition.bind(this)).filter(x => x).length === 0) {
            return [this.tabPosToGraph(this.DISPLACEMENT_FUNCTIONS[(this.previous + 3) % 6](this._botPosition)), this.tabPosToGraph(this._opponentPosition)];
        }

        this.tree = {};
        this.tree[position] = {"Parent": null, "Childs": [], "Score": -Infinity, "Next Position": null, "Depth": 0, "Visited": 0};

        let stack = [position];
        let elementsToRestore = {};
        while (stack.length > 0) {
            // If the positions of both players are the same, it is not a good move.
            if (JSON.parse(stack[stack.length - 1])[0] === JSON.parse(stack[stack.length - 1])[1]) {
                this.tree[stack[stack.length - 1]].Score = ((this.tree[stack[stack.length - 1]].depth) % 2 === 0 ? Number.MAX_VALUE : -Number.MAX_VALUE);
                stack.pop();
            }
            // Otherwise, the children of the current node in the this.tree are created according to the possible positions around the current one to be evaluated.
            else if (this.tree[stack[stack.length - 1]].Depth !== maxDepth && this.tree[stack[stack.length - 1]].Visited < 1) {
                let depth = this.tree[stack[stack.length - 1]].Depth;

                let children = [...Array.from(this.graph[JSON.parse(stack[stack.length - 1])[depth % 2]]).map(
                    el => {
                        if (depth % 2 === 0)
                            return JSON.stringify([el, JSON.parse(stack[stack.length - 1])[1]]);
                        else
                            return JSON.stringify([JSON.parse(stack[stack.length - 1])[0], el]);
                    })
                ];

                for (const child of children) {
                    this.tree[child] = {
                        "Parent": stack[stack.length - 1],
                        "Childs": [],
                        "Score": ((depth + 1) % 2 === 0 ? -Infinity : Infinity),
                        "Next Position": null,
                        "Depth": this.tree[stack[stack.length - 1]].Depth + 1,
                        "Visited": 0
                    };
                }

                this.tree[stack[stack.length - 1]].Childs = children;
                this.tree[stack[stack.length - 1]].Visited = 1;

                // The neighbors of the current position are stored to restore the this.graph representation of the this.board's status later.
                elementsToRestore[JSON.parse(stack[stack.length - 1])[depth % 2]] = this.graph[JSON.parse(stack[stack.length - 1])[depth % 2]];

                // The current node's position is deleted from the this.graph representation of the this.board's status because, after this move, it is no longer accessible.
                for (const p of this.graph[JSON.parse(stack[stack.length - 1])[depth % 2]]) {
                    this.graph[p].delete(JSON.parse(stack[stack.length - 1])[depth % 2]);
                }
                delete this.graph[JSON.parse(stack[stack.length - 1])[depth % 2]];
                stack = stack.concat(children);
            } else {

                if (this.tree[stack[stack.length - 1]].Depth === maxDepth) {
                    this.tree[stack[stack.length - 1]].Score = this.evaluation(JSON.parse(stack[stack.length - 1]));//, this.tree[queue[queue.length - 1]].Depth);
                } else {
                    for (const child of this.tree[stack[stack.length - 1]].Childs) {
                        if (this.tree[stack[stack.length - 1]].Depth % 2 === 0 && this.tree[stack[stack.length - 1]].Score < this.tree[child].Score) {
                            this.tree[stack[stack.length - 1]].Score = this.tree[child].Score;
                            this.tree[stack[stack.length - 1]]["Next Position"] = child;
                        } else if (this.tree[stack[stack.length - 1]].Depth % 2 === 1 && this.tree[stack[stack.length - 1]].Score > this.tree[child].Score) {
                            this.tree[stack[stack.length - 1]].Score = this.tree[child].Score;
                            this.tree[stack[stack.length - 1]]["Next Position"] = child;
                        }
                        delete this.tree[child];
                    }

                    // Restoration of the this.graph representing the this.board's status before the position was added to the this.tree.
                    let restore = elementsToRestore[JSON.parse(stack[stack.length - 1])[this.tree[stack[stack.length - 1]].Depth % 2]];
                    let key = JSON.parse(stack[stack.length - 1])[this.tree[stack[stack.length - 1]].Depth % 2];

                    delete elementsToRestore[JSON.parse(stack[stack.length - 1])[this.tree[stack[stack.length - 1]].Depth % 2]];

                    this.graph[key] = restore;
                    for (const restoreKey of restore) {
                        this.graph[restoreKey].add(key);
                    }

                    if (this.tree[stack[stack.length - 1]].Childs.length === 0) {
                        this.tree[stack[stack.length - 1]].Score = this.evaluation(JSON.parse(stack[stack.length - 1]));
                    }
                }
                stack.pop();
            }

        }
        return JSON.parse(this.tree[position]["Next Position"]);
    }

    evaluation(position) {
        let voronoiResult = this.voronoiHeuristic(this.graphToTabPos(position[0]), this.graphToTabPos(position[1]));
        return voronoiResult[0][0] - voronoiResult[0][1];
    }

    updatePlayerState(playersState) {
        if (this.round > 1) {
            for (const position of [this.tabPosToGraph(this._botPosition), this.tabPosToGraph(this._opponentPosition)]) {
                for (const p of this.graph[position]) {
                    this.graph[p].delete(position);
                }
                delete this.graph[position];
            }
        }
        this._botPosition = [playersState["playerPosition"]["row"], playersState["playerPosition"]["column"]];
        this._opponentPosition = [playersState["opponentPosition"]["row"], playersState["opponentPosition"]["column"]];
        this.board[this._botPosition[0]][this._botPosition[1]] = 1;
        this.board[this._opponentPosition[0]][this._opponentPosition[1]] = 2;
    }

    getNextMove() {
        let resMinimax = this.miniMax(5);
        let nextPosition = this.graphToTabPos(resMinimax[0]);
        let deltaPositions = [nextPosition[0] - this._botPosition[0], nextPosition[1] - this._botPosition[1]];
        let moveInActualConfiguration = (3 * deltaPositions[0] + deltaPositions[1]) + 3 + ((deltaPositions[0] !== 0 && this._botPosition[0] % 2 !== 0) ? 1 : 0);
        let indexMoveInDefaultConfiguration = ((this.dictMovesIndex[moveInActualConfiguration] + (this.init - this.previous)) + 6) % 6;

        this.previous = ((this.dictMovesIndex[moveInActualConfiguration] - 3) + 6) % 6;

        return this.moves[indexMoveInDefaultConfiguration];
    }

    setup(playersState) {
        return new Promise((resolve) => {
            this.round = 0;
            this.createBoard(9, 16);
            this.createGraph();
            this.updatePlayerState(playersState);
            this.previous = (this._botPosition[1] % 16 === 0 ? 2 : 5);
            resolve(true);
        });
    }

    nextMove(playersState) {
        return new Promise((resolve) => {
            this.round++;
            this.updatePlayerState(playersState);
            let nextMove = this.getNextMove();
            resolve(nextMove);
        });
    }
}


