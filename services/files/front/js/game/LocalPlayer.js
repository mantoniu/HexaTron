import {Player} from "./Player.js";
import {defaultDisplacementConfiguration, Directions} from "./GameUtils.js";

export class LocalPlayer extends Player {
    constructor(id, name, color, profilePicturePath, keyConfiguration) {
        super(id, name, color, profilePicturePath);
        this._keys = keyConfiguration;
        this._pressedKey = null;

        this.setupListener();
    }

    setup(playersState) {
        let defaultDirection = playersState.playerPosition.column === 1 ? Directions.RIGHT : Directions.LEFT;

        this._keyDisplacementsMapping = defaultDisplacementConfiguration(this._keys);
        this.remapKeys(Directions.RIGHT - defaultDirection);

        this.comingDirection = defaultDirection;
    }

    remapKeys(diff) {
        for (let key of Object.keys(this._keyDisplacementsMapping))
            this._keyDisplacementsMapping[key] = ((this._keyDisplacementsMapping[key] + diff) + 6) % 6;
    }

    updateKeyMapping(key) {
        let diff = this._keyDisplacementsMapping[key] - this.comingDirection;
        this.comingDirection = this._keyDisplacementsMapping[key];

        this.remapKeys(diff);
    }

    nextMove() {
        if (!this._pressedKey)
            return null;

        const direction = this._keyDisplacementsMapping[this._pressedKey.toLowerCase()];
        this.updateKeyMapping(this._pressedKey);

        this._pressedKey = null;

        return direction;
    }

    setupListener() {
        window.addEventListener('keydown', (event) => {
            if (this._keys.includes(event.key.toLowerCase()))
                this._pressedKey = event.key;
        });
    }
}