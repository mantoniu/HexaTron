import {defaultDisplacementConfiguration, Directions, DISPLACEMENT_FUNCTIONS} from "./GameUtils.js";

export class MovementManager {
    constructor(game, canvas, playerId, playerColor, keyConfiguration) {
        this._game = game;
        this._canvas = canvas;
        this._playerId = playerId;
        this._playerColor = playerColor;
        this._pressedKey = null;
        this._keys = keyConfiguration;

        this.setupListener();
    }

    setupListener() {
        window.addEventListener('keydown', (event) => {
            if (this._keys.includes(event.key.toLowerCase()))
                this._pressedKey = event.key.toLowerCase();
        });
    }

    updateKeyMapping(key) {
        let diff = this._keyDisplacementsMapping[key] - this.comingDirection;
        this.comingDirection = this._keyDisplacementsMapping[key];

        for (let key of Object.keys(this._keyDisplacementsMapping))
            this._keyDisplacementsMapping[key] = ((this._keyDisplacementsMapping[key] + diff) % 6 + 6) % 6;
    }

    isValidPosition(position) {
        return this._game.board.isVacant(position);
    }

    handleKeyPress() {
        const currentPos = this._game.getPlayerPosition(this._playerId);
        let newPos = DISPLACEMENT_FUNCTIONS[this.comingDirection](currentPos);

        if (this._pressedKey) {
            const displacement = this._keyDisplacementsMapping[this._pressedKey.toLowerCase()];
            newPos = DISPLACEMENT_FUNCTIONS[displacement](currentPos);

            if (this.isValidPosition(newPos))
                this.updateKeyMapping(this._pressedKey);

            this._pressedKey = null;
        }

        if (this.isValidPosition(newPos)) {
            this._game.board.fillTile(newPos[0], newPos[1], this._playerColor, this._canvas, this.comingDirection);
            this._game.setPlayerPosition(this._playerId, newPos);
            return true;
        }

        return false;
    }

    initialize() {
        let playerPosition = this._game.getPlayerPosition(this._playerId);
        this.comingDirection = playerPosition[1] === 1 ? Directions.RIGHT : Directions.LEFT;
        this._keyDisplacementsMapping = defaultDisplacementConfiguration(this._keys);
    }
}