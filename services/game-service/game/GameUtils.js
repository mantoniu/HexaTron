const Position = require("./Position.js");

/**
 * Enum for the types of displacements in the hexagonal grid system.
 *
 * - ABSOLUTE: Uses a fixed, grid-based direction (e.g., UPPER_LEFT).
 * - RELATIVE: Depends on current orientation and path-following logic (e.g., KEEP_GOING, HEAVY_LEFT).
 *
 * @readonly
 * @enum {string}
 */
const DISPLACEMENT_TYPES = Object.freeze({
    ABSOLUTE: "ABSOLUTE",
    RELATIVE: "RELATIVE"
});

/**
 * Enum for absolute displacements on a hexagonal grid.
 * These represent fixed directions regardless of current orientation.
 *
 * @readonly
 * @enum {number}
 */
const ABSOLUTE_DISPLACEMENTS = Object.freeze({
    UPPER_LEFT: 0,
    UPPER_RIGHT: 1,
    RIGHT: 2,
    LOWER_RIGHT: 3,
    LOWER_LEFT: 4,
    LEFT: 5
});

/**
 * Enum for relative displacements, used when displacement is based
 * on the previous direction.
 *
 * - HEAVY_LEFT: Turn two steps to the left.
 * - LIGHT_LEFT: Turn one step to the left.
 * - KEEP_GOING: Continue in the same direction.
 * - LIGHT_RIGHT: Turn one step to the right.
 * - HEAVY_RIGHT: Turn two steps to the right.
 *
 * @readonly
 * @enum {string}
 */
const RELATIVE_DISPLACEMENTS = Object.freeze({
    HEAVY_LEFT: "HEAVY_LEFT",
    LIGHT_LEFT: "LIGHT_LEFT",
    KEEP_GOING: "KEEP_GOING",
    LIGHT_RIGHT: "LIGHT_RIGHT",
    HEAVY_RIGHT: "HEAVY_RIGHT"
});

/**
 * Array of functions to compute the next position from an absolute displacement
 * on a hexagonal grid. Each function corresponds to one of the six possible
 * displacement defined in ABSOLUTE_DISPLACEMENTS.
 *
 * @type {Array<(position: Position) => Position>}
 */
const absoluteDisplacementToPosition = [
    getUpperLeftPosition,
    getUpperRightPosition,
    getRightPosition,
    getLowerRightPosition,
    getLowerLeftPosition,
    getLeftPosition
];

const defaultMovementsMapping = {
    [RELATIVE_DISPLACEMENTS.HEAVY_LEFT]: ABSOLUTE_DISPLACEMENTS.UPPER_LEFT,
    [RELATIVE_DISPLACEMENTS.LIGHT_LEFT]: ABSOLUTE_DISPLACEMENTS.UPPER_RIGHT,
    [RELATIVE_DISPLACEMENTS.KEEP_GOING]: ABSOLUTE_DISPLACEMENTS.RIGHT,
    [RELATIVE_DISPLACEMENTS.LIGHT_RIGHT]: ABSOLUTE_DISPLACEMENTS.LOWER_RIGHT,
    [RELATIVE_DISPLACEMENTS.HEAVY_RIGHT]: ABSOLUTE_DISPLACEMENTS.LOWER_LEFT
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
    ABSOLUTE_DISPLACEMENTS,
    RELATIVE_DISPLACEMENTS,
    DISPLACEMENT_TYPES,
    absoluteDisplacementToPosition,
    defaultMovementsMapping
};