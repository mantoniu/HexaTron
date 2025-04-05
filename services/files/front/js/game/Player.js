/**
 * Enum for player types.
 *
 * @readonly
 * @enum {number}
 */
export const PlayerType = Object.freeze({
    NORMAL: 0,
    LOCAL: 1,
    AI: 1,
});

export class Player {
    constructor(id, name) {
        this._id = id;
        this._name = name;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }
}