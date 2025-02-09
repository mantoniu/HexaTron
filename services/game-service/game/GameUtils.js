const Position = require("./Position.js");

/**
 * Enum for hexagonal grid movement directions
 * @enum {number}
 * @readonly
 */
const Directions = {
    UPPER_LEFT: 0,
    UPPER_RIGHT: 1,
    RIGHT: 2,
    LOWER_RIGHT: 3,
    LOWER_LEFT: 4,
    LEFT: 5
};

/**
 * Hexagonal grid movement type descriptors
 * @enum {string}
 * @readonly
 */
const MovementTypes = {
    HEAVY_LEFT: "HEAVY_LEFT",
    LIGHT_LEFT: "LIGHT_LEFT",
    KEEP_GOING: "KEEP_GOING",
    LIGHT_RIGHT: "LIGHT_RIGHT",
    HEAVY_RIGHT: "HEAVY_RIGHT"
};

/**
 * Array of position calculation functions for each direction
 * @type {Array<(position: Position) => Position>}
 */
const DISPLACEMENT_FUNCTIONS = [
    getUpperLeftPosition,
    getUpperRightPosition,
    getRightPosition,
    getLowerRightPosition,
    getLowerLeftPosition,
    getLeftPosition
];

/**
 * Creates default key-to-direction mapping configuration
 * @param {string[]} keys - Array of keyboard keys for directions
 * @returns {Object.<string, MovementTypes>} Mapping of keys to directions
 */
const defaultMovementsConfiguration = (keys) => ({
    [keys[0]]: MovementTypes.LIGHT_LEFT,
    [keys[1]]: MovementTypes.HEAVY_LEFT,
    [keys[2]]: MovementTypes.LIGHT_RIGHT,
    [keys[3]]: MovementTypes.HEAVY_RIGHT
});

const defaultMovementsMapping = {
    [MovementTypes.HEAVY_LEFT]: Directions.UPPER_LEFT,
    [MovementTypes.LIGHT_LEFT]: Directions.UPPER_RIGHT,
    [MovementTypes.KEEP_GOING]: Directions.RIGHT,
    [MovementTypes.LIGHT_RIGHT]: Directions.LOWER_RIGHT,
    [MovementTypes.HEAVY_RIGHT]: Directions.LOWER_LEFT
};

/**
 * Calculates upper-left position in hexagonal grid
 * @param {Position} position - Current position
 * @returns {Position} New position
 */
function getUpperLeftPosition(position) {
    return new Position(
        position.row - 1,
        position.row % 2 === 0 ? position.column : position.column - 1
    );
}

/**
 * Calculates upper-right position in hexagonal grid
 * @param {Position} position - Current position
 * @returns {Position} New position
 */
function getUpperRightPosition(position) {
    return new Position(
        position.row - 1,
        position.row % 2 === 0 ? position.column + 1 : position.column
    );
}

/**
 * Calculates left position in hexagonal grid
 * @param {Position} position - Current position
 * @returns {Position} New position
 */
function getLeftPosition(position) {
    return new Position(
        position.row,
        position.column - 1
    );
}

/**
 * Calculates right position in hexagonal grid
 * @param {Position} position - Current position
 * @returns {Position} New position
 */
function getRightPosition(position) {
    return new Position(
        position.row,
        position.column + 1
    );
}

/**
 * Calculates lower-left position in hexagonal grid
 * @param {Position} position - Current position
 * @returns {Position} New position
 */
function getLowerLeftPosition(position) {
    return new Position(
        position.row + 1,
        position.row % 2 === 0 ? position.column : position.column - 1
    );
}

/**
 * Calculates lower-right position in hexagonal grid
 * @param {Position} position - Current position
 * @returns {Position} New position
 */
function getLowerRightPosition(position) {
    return new Position(
        position.row + 1,
        position.row % 2 === 0 ? position.column + 1 : position.column
    );
}

module.exports = {
    Directions,
    MovementTypes,
    DISPLACEMENT_FUNCTIONS,
    defaultMovementsMapping,
    defaultMovementsConfiguration,
    getLowerRightPosition,
    getLowerLeftPosition,
    getUpperRightPosition,
    getUpperLeftPosition,
    getLeftPosition,
    getRightPosition
};