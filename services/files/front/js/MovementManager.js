import {
    Directions,
    getLeftPosition,
    getLowerLeftPosition,
    getLowerRightPosition,
    getRightPosition,
    getUpperLeftPosition,
    getUpperRightPosition
} from "./GameUtils.js";

export class MovementManager {
    constructor(game, canvas, playerId, playerColor, keyConfiguration) {
        this._game = game;
        this._canvas = canvas;
        this._playerId = playerId;
        this._playerColor = playerColor;
        this._pressedKey = null;

        this._displacements = [
            getUpperLeftPosition,
            getUpperRightPosition,
            getRightPosition,
            getLowerRightPosition,
            getLowerLeftPosition,
            getLeftPosition
        ];

        this._keys = keyConfiguration;
        this.setupListener();
    }

    get playerId() {
        return this._playerId;
    }

    setupListener() {
        window.addEventListener('keydown', (event) => {
            if (this._keys.includes(event.key.toLowerCase()))
                this._pressedKey = event.key.toLowerCase();
        });
    }

    defaultDisplacementConfiguration(keys) {
        let dict = {};
        dict[keys[0]] = Directions.UPPER_RIGHT;
        dict[keys[1]] = Directions.UPPER_LEFT;
        dict[keys[2]] = Directions.LOWER_RIGHT;
        dict[keys[3]] = Directions.LOWER_LEFT;
        return dict;
    }

    updateKeyMapping(key) {
        let diff = this._keyDisplacementsMapping[key] - this.comingDirection;
        this.comingDirection = this._keyDisplacementsMapping[key];

        for (let key of Object.keys(this._keyDisplacementsMapping)) {
            this._keyDisplacementsMapping[key] = ((this._keyDisplacementsMapping[key] + diff) % 6 + 6) % 6;
        }
    }

    isValidPosition(position) {
        return this._game.board.isVacant(position);
    }

    handleKeyPress() {
        const currentPos = this._game.getPlayerPosition(this._playerId);
        let newPos = this._displacements[this.comingDirection](currentPos);

        if (this._pressedKey) {
            const displacement = this._keyDisplacementsMapping[this._pressedKey.toLowerCase()];

            newPos = this._displacements[displacement](currentPos);

            if (this.isValidPosition(newPos)) {
                this.updateKeyMapping(this._pressedKey);
            }

            this._pressedKey = null;
        }

        if (this.isValidPosition(newPos)) {
            this.fillTile(newPos, this._playerColor);
            this._game.setPlayerPosition(this._playerId, newPos);
            return true;
        }

        return false;
    }

    initialize(playerPosition) {
        this.comingDirection = playerPosition[1] === 1 ? Directions.RIGHT : Directions.LEFT;
        this._keyDisplacementsMapping = this.defaultDisplacementConfiguration(this._keys);
    }

    fillTile(position, color) {
        this._game.board.fillTile(position[1], position[0], color, this._canvas);
    }
}