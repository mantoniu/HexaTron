const Player = require("./Player.js");

class RemotePlayer extends Player {
    constructor(id, name, profilePicturePath) {
        super(id, name, profilePicturePath);
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
        console.log("MOVE", move);
        if (this._currentResolve) {
            this._currentResolve(move);
            this._currentResolve = null;
        }
    }
}

module.exports = RemotePlayer;