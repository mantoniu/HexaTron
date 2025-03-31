/**
 * Game settings constants.
 *
 * @readonly
 * @enum {number}
 */
const GAME_SETTINGS = Object.freeze({
    ROW_NUMBER: 9,
    COL_NUMBER: 16,
    ROUNDS_COUNT: 3,
    PLAYERS_COUNT: 2,
});

/**
 * Generates a random integer between 0 (inclusive) and the specified maximum (exclusive).
 *
 * @param {number} max - The upper bound for the random number generation.
 * @returns {number} A random integer between 0 and `max - 1`.
 */
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

module.exports = {getRandomInt, GAME_SETTINGS};