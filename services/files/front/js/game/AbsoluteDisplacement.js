import {Displacement} from "./Displacement.js";
import {DISPLACEMENT_TYPES} from "./GameUtils.js";

/**
 * Represents an absolute displacement in the game space.
 * @extends Displacement
 */
export class AbsoluteDisplacement extends Displacement {
    /**
     * Creates a new AbsoluteDisplacement instance.
     * @param {number} value - An absolute displacement value from {@link ABSOLUTE_DISPLACEMENTS}.
     */
    constructor(value) {
        super(DISPLACEMENT_TYPES.ABSOLUTE, value);
    }

    /**
     * Returns the opposite displacement of the current displacement.
     * @returns {AbsoluteDisplacement} A new instance with the inverted displacement.
     */
    invert() {
        const invertedValue = (this.value + 3) % 6;
        return new AbsoluteDisplacement(invertedValue);
    }
}