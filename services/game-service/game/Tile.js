/**
 * Enum for tile status.
 *
 * @readonly
 * @enum {number}
 */
const Status = Object.freeze({
    /** Represents a wall tile. */
    WALL: -1,
    /** Represents a vacant tile. */
    VACANT: 0,
    /** Represents a taken tile. */
    TAKEN: 1
});

/**
 * Represents a tile on the game board.
 */
class Tile {
    /**
     * Creates an instance of a Tile.
     * @param {Status} status - The initial status of the tile.
     */
    constructor(status) {
        /** @type {Status} */
        this._status = status;
        /** @type {string|null} */
        this._takenID = null;
    }

    /**
     * Gets the ID of the player who occupies the tile.
     *
     * @returns {string} The ID of the player who occupies the tile.
     * @throws {Error} If the tile is not taken.
     */
    get takenID() {
        if (this.status !== Status.TAKEN) throw new Error("The Tile is not taken by a player");
        return this._takenID;
    }

    /**
     * Sets the ID of the player who occupies the tile.
     *
     * @param {string} id - The ID of the player.
     */
    set takenID(id) {
        this._takenID = id;
    }

    /**
     * Gets the status of the tile.
     *
     * @returns {Status} The current status of the tile.
     */
    get status() {
        return this._status;
    }

    /**
     * Sets the status of the tile.
     *
     * @param {Status} status - The new status of the tile.
     */
    set status(status) {
        this._status = status;
    }
}

module.exports = {Tile, Status};