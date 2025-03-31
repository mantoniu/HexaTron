/**
 * Represents the state of a player in the game.
 */
class PlayerState {
    /**
     * @param {Position} playerPosition - The position of the player.
     * @param {Position} opponentPosition - The position of the opponent.
     */
    constructor(playerPosition, opponentPosition) {
        /** @type {Position} */
        this._playerPosition = playerPosition;
        /** @type {Position} */
        this._opponentPosition = opponentPosition;
    }

    /**
     * @returns {Position} The position of the player.
     */
    get playerPosition() {
        return this._playerPosition;
    }

    /**
     * @returns {Position} The position of the opponent.
     */
    get opponentPosition() {
        return this._opponentPosition;
    }
}

module.exports = PlayerState;