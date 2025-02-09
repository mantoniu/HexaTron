class PlayerState {
    constructor(playerPosition, opponentPosition) {
        this._playerPosition = playerPosition;
        this._opponentPosition = opponentPosition;
    }

    get playerPosition() {
        return this._playerPosition;
    }

    get opponentPosition() {
        return this._opponentPosition;
    }
}

module.exports = PlayerState;