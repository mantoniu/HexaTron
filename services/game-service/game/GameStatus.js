/**
 * Enum representing game statuses.
 *
 * @readonly
 * @enum {number}
 */
const GameStatus = Object.freeze({
    CREATED: 'CREATED',
    POSITIONS_UPDATED: 'POSITION_UPDATED',
    ROUND_END: 'ROUND_END',
    GAME_END: 'GAME_END',
});

module.exports = GameStatus;