const {Player} = require("./Player");

class RemotePlayer extends Player {
    constructor(id, name) {
        super(id, name);
        this._currentResolve = null;
    }

    setup() {
    }

    nextMove() {
        return new Promise(resolve => {
            this._currentResolve = resolve;
        });
    }

    resolveMove(move) {
        if (this._currentResolve) {
            this._currentResolve(move);
            this._currentResolve = null;
        }
    }
}

module.exports = RemotePlayer;