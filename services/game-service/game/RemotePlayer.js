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
     * Initiates the player's next displacement as a promise.
     *
     * @returns {Promise<{type: string, value: string|number}>} A promise that resolves with the player's displacement.
     */
    nextDisplacement() {
        return new Promise(resolve => {
            this._currentResolve = resolve;
        });
    }

    /**
     * Resolves the player's displacement.
     *
     * @param {{type: string, value: string|number}} move - The displacement that the player has decided to make.
     */
    resolveDisplacement(move) {
        if (this._currentResolve) {
            this._currentResolve(move);
            this._currentResolve = null;
        }
    }
}

module.exports = RemotePlayer;