import {defaultDisplacementConfiguration, Directions} from "./GameUtils.js";

export class Player {
    constructor(id, name, color, keyConfiguration) {
        this._id = id;
        this._color = color;
        this._keys = keyConfiguration;
        this._name = name;
        this.onAction = null;

        this.setupListener();
    }

    get color() {
        return this._color;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    initialize(defaultDirection) {
        this._keyDisplacementsMapping = defaultDisplacementConfiguration(this._keys);
        this.remapKeys(Directions.RIGHT - defaultDirection);

        this.comingDirection = defaultDirection;
    }

    setupListener() {
        window.addEventListener('keydown', (event) => {
            if (this._keys.includes(event.key.toLowerCase()))
                this.onAction(this.id, this.computeDirection(event.key));
        });
    }

    remapKeys(diff) {
        for (let key of Object.keys(this._keyDisplacementsMapping))
            this._keyDisplacementsMapping[key] = ((this._keyDisplacementsMapping[key] + diff) % 6 + 6) % 6;
    }

    updateKeyMapping(key) {
        let diff = this._keyDisplacementsMapping[key] - this.comingDirection;
        this.comingDirection = this._keyDisplacementsMapping[key];

        this.remapKeys(diff);
    }

    computeDirection(key) {
        const direction = this._keyDisplacementsMapping[key.toLowerCase()];
        this.updateKeyMapping(key);

        return direction;
    }
}