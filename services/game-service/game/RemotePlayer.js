const {Player} = require("./Player");

/**
 * Represents a remote player in the game.
 * @extends Player
 */
class RemotePlayer extends Player {
    /**
     * Creates an instance of a remote player.
     *
     * @param {string} id - The player's ID.
     * @param {string} name - The player's name.
     */
    constructor(id, name) {
        super(id, name);
        /** @type {Function|null} */
        this._currentResolve = null;
    }

    /**
     * Initializes the setup for the player.
     */
    setup() {
    }

    /**
     * Initiates the player's next move as a promise.
     *
     * @returns {Promise<string>} A promise that resolves with the player's move.
     */
    nextMove() {
        return new Promise(resolve => {
            this._currentResolve = resolve;
        });
    }

    /**
     * Resolves the player's move.
     *
     * @param {string} move - The move that the player has decided to make.
     */
    resolveMove(move) {
        if (this._currentResolve) {
            this._currentResolve(move);
            this._currentResolve = null;
        }
    }
}

module.exports = RemotePlayer;