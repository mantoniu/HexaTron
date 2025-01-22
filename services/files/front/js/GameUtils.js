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
 * @type {Array<(position: number[]) => number[]>}
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
 * @param {[number, number]} position - Current [row, col] position
 * @returns {[number, number]} New [row, col] position
 */
export function getUpperLeftPosition(position) {
    return [
        position[0] - 1,
        position[0] % 2 === 0 ? position[1] : position[1] - 1
    ];
}

export function getUpperRightPosition(position) {
    return [
        position[0] - 1,
        position[0] % 2 === 0 ? position[1] + 1 : position[1]
    ];
}

export function getLeftPosition(position) {
    return [
        position[0],
        position[1] - 1
    ];
}

export function getRightPosition(position) {
    return [
        position[0],
        position[1] + 1
    ];
}

export function getLowerLeftPosition(position) {
    return [
        position[0] + 1,
        position[0] % 2 === 0 ? position[1] : position[1] - 1
    ];
}

export function getLowerRightPosition(position) {
    return [
        position[0] + 1,
        position[0] % 2 === 0 ? position[1] + 1 : position[1]
    ];
}