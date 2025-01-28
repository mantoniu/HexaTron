import {Position} from "./Position.js";

/**
 * Enum for hexagonal grid movement directions
 * @enum {number}
 */
export const Directions = {
    UPPER_LEFT: 0,
    UPPER_RIGHT: 1,
    RIGHT: 2,
    LOWER_RIGHT: 3,
    LOWER_LEFT: 4,
    LEFT: 5
};

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
 * @returns {Object.<string, number>} Mapping of keys to directions
 */
export const defaultDisplacementConfiguration = (keys) => ({
    [keys[0]]: Directions.UPPER_RIGHT,
    [keys[1]]: Directions.UPPER_LEFT,
    [keys[2]]: Directions.LOWER_RIGHT,
    [keys[3]]: Directions.LOWER_LEFT
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