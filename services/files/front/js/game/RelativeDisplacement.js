import {DISPLACEMENT_TYPES, RELATIVE_DISPLACEMENTS} from "./GameUtils.js";
import {Displacement} from "./Displacement.js";

/**
 * Represents a relative displacement in the game.
 * @extends Displacement
 */
export class RelativeDisplacement extends Displacement {
    /**
     * Creates a new RelativeDisplacement instance.
     * @param {string} value - A relative displacement value from {@link RELATIVE_DISPLACEMENTS}.
     */
    constructor(value) {
        super(DISPLACEMENT_TYPES.RELATIVE, value);
    }

    /**
     * Returns the mirrored displacement of the current displacement.
     *
     * @returns {RelativeDisplacement} A new RelativeDisplacement instance with the inverted displacement
     */
    invert() {
        const movements = Object.values(RELATIVE_DISPLACEMENTS);
        const index = movements.indexOf(this.value);

        if (index === -1)
            throw new Error(`Invalid relative displacement value: ${this.value}`);

        const mirroredIndex = movements.length - 1 - index;
        return new RelativeDisplacement(movements[mirroredIndex]);
    }
}
