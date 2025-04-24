/**
 * Abstract class representing a generic displacement in the game.
 * Should not be instantiated directly.
 */
export class Displacement {
    /**
     * Creates a new Displacement instance.
     * @param {string} type - The type of displacement (e.g., ABSOLUTE, RELATIVE).
     * @param {*} value - The value associated with the displacement.
     */
    constructor(type, value) {
        this._type = type;
        this._value = value;
    }

    /**
     * Inverts the displacement.
     * Must be implemented by subclasses.
     * @throws {Error} Always throws if called directly from the base class.
     */
    invert() {
        throw new Error("invert() must be implemented by subclasses");
    }

    /**
     * Returns the value associated with this displacement.
     * @returns {*} The displacement value.
     */
    get value() {
        return this._value;
    }

    /**
     * Serializes the displacement to a JSON object.
     * @returns {{type: string, value: *}} JSON representation of the displacement.
     */
    toJSON() {
        return {type: this._type, value: this._value};
    }
}
