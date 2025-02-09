function getUpperLeftPosition(position) {
    return [
        position[0] - 1,
        position[0] % 2 === 0 ? position[1] : position[1] - 1
    ];
}

function getUpperRightPosition(position) {
    return [
        position[0] - 1,
        position[0] % 2 === 0 ? position[1] + 1 : position[1]
    ];
}

function getLeftPosition(position) {
    return [
        position[0],
        position[1] - 1
    ];
}

function getRightPosition(position) {
    return [
        position[0],
        position[1] + 1
    ];
}

function getLowerLeftPosition(position) {
    return [
        position[0] + 1,
        position[0] % 2 === 0 ? position[1] : position[1] - 1
    ];
}

function getLowerRightPosition(position) {
    return [
        position[0] + 1,
        position[0] % 2 === 0 ? position[1] + 1 : position[1]
    ];
}

const DISPLACEMENT_FUNCTIONS = [
    getUpperLeftPosition,
    getUpperRightPosition,
    getRightPosition,
    getLowerRightPosition,
    getLowerLeftPosition,
    getLeftPosition
];

function neighbour(position, side) {
    return DISPLACEMENT_FUNCTIONS[side](position);
}

module.exports = {DISPLACEMENT_FUNCTIONS, neighbour};