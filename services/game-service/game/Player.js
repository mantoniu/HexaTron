/**
 * Enum for player types.
 *
 * @readonly
 * @enum {number}
 */
const PlayerType = Object.freeze({
    NORMAL: 0,
    AI: 1,
});

/**
 * Represents a player in the game.
 */
class Player {
    /**
     * @param {string} id - The unique identifier of the player.
     * @param {string} name - The name of the player.
     */
    constructor(id, name) {
        /** @type {string} */
        this._id = id;
        /** @type {string} */
        this._name = name;
    }

    /**
     * @returns {number} The type of the player (normal or AI).
     */
    get playerType() {
        return PlayerType.NORMAL;
    }

    /**
     * @returns {string} The unique identifier of the player.
     */
    get id() {
        return this._id;
    }

    /**
     * @returns {string} The name of the player.
     */
    get name() {
        return this._name;
    }
}

module.exports = {Player, PlayerType};