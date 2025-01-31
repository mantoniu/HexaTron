import {Player} from "./Player.js";
import {defaultMovementsConfiguration} from "./GameUtils.js";

export class LocalPlayer extends Player {
    constructor(id, name, color, profilePicturePath, keyConfiguration) {
        super(id, name, color, profilePicturePath);
        this._keys = keyConfiguration;
        this._movementsMapping = defaultMovementsConfiguration(keyConfiguration);
        this._currentResolve = null;
        this.setupListener();
    }

    setup() {
    }

    setupListener() {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            if (this._keys.includes(key) && this._currentResolve) {
                const move = this._movementsMapping[key];
                this._currentResolve(move);
                this._currentResolve = null;
            }
        });
    }

    nextMove() {
        return new Promise(resolve => {
            this._currentResolve = resolve;
        });
    }
}