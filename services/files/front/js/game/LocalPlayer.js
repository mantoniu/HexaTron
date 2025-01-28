import {Player} from "./Player.js";
import {defaultMovementsConfiguration, MovementTypes} from "./GameUtils.js";

export class LocalPlayer extends Player {
    constructor(id, name, color, profilePicturePath, keyConfiguration) {
        super(id, name, color, profilePicturePath);
        this._keys = keyConfiguration;
        this._movementsMapping = defaultMovementsConfiguration(keyConfiguration);
        this._pressedKey = null;

        this.setupListener();
    }

    setup() {
    }

    nextMove() {
        if (!this._pressedKey)
            return MovementTypes.KEEP_GOING;

        const movement = this._movementsMapping[this._pressedKey.toLowerCase()];
        this._pressedKey = null;
        return movement;
    }

    setupListener() {
        window.addEventListener('keydown', (event) => {
            if (this._keys.includes(event.key.toLowerCase()))
                this._pressedKey = event.key;
        });
    }
}