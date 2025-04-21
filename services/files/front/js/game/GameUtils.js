import {Position} from "./Position.js";

/**
 * Enum for the types of displacements in the hexagonal grid system.
 *
 * - ABSOLUTE: Uses a fixed, grid-based direction (e.g., UPPER_LEFT).
 * - RELATIVE: Depends on current orientation and path-following logic (e.g., KEEP_GOING, HEAVY_LEFT).
 *
 * @readonly
 * @enum {string}
 */
export const DISPLACEMENT_TYPES = Object.freeze({
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
export const ABSOLUTE_DISPLACEMENTS = Object.freeze({
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
export const RELATIVE_DISPLACEMENTS = Object.freeze({
    HEAVY_LEFT: "HEAVY_LEFT",
    LIGHT_LEFT: "LIGHT_LEFT",
    KEEP_GOING: "KEEP_GOING",
    LIGHT_RIGHT: "LIGHT_RIGHT",
    HEAVY_RIGHT: "HEAVY_RIGHT"
});

/**
 * Array of position calculation functions for each direction
 * @type {Array<(position: Position) => Position>}
 */
export const DISPLACEMENT_FUNCTIONS = [
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
 * @returns {Object.<string, string>} Mapping of keys to directions
 */
export const defaultMovementsConfiguration = (keys) => ({
    [keys[0]]: RELATIVE_DISPLACEMENTS.LIGHT_LEFT,
    [keys[1]]: RELATIVE_DISPLACEMENTS.HEAVY_LEFT,
    [keys[2]]: RELATIVE_DISPLACEMENTS.LIGHT_RIGHT,
    [keys[3]]: RELATIVE_DISPLACEMENTS.HEAVY_RIGHT
});

/**
 * Calculates upper-left position in hexagonal grid
 * @param {Position} position - Current position
 * @returns {Position} New position
 */
export function getUpperLeftPosition(position) {
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
export function getUpperRightPosition(position) {
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
export function getLeftPosition(position) {
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
export function getRightPosition(position) {
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
export function getLowerLeftPosition(position) {
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
export function getLowerRightPosition(position) {
    return new Position(
        position.row + 1,
        position.row % 2 === 0 ? position.column + 1 : position.column
    );
}