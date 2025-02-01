import {defaultMovementsMapping, DISPLACEMENT_FUNCTIONS, MovementTypes} from "../game/GameUtils.js";
import {Player} from "../game/Player.js";

export class AI extends Player {
    constructor(id, name, color) {
        super(id, name, color, null, null);
        this._movementsMapping = {...defaultMovementsMapping};
    }

    remapMovements(movement, newDirection) {
        const diff = newDirection - this._movementsMapping[MovementTypes.KEEP_GOING];

        for (const [movement, directionValue] of Object.entries(this._movementsMapping))
            this._movementsMapping[movement] = (directionValue + diff + 6) % 6;
    }

    computePossibleMovements(pos) {
        const possibleMovements = {};

        for (const [movement, direction] of Object.entries(this._movementsMapping)) {
            const newPos = DISPLACEMENT_FUNCTIONS[direction](pos);
            if (this._board.checkPositionValidity(newPos))
                possibleMovements[movement] = {direction: direction, pos: newPos};
        }

        return possibleMovements;
    }
}