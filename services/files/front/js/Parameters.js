export class Parameters {
    constructor() {
        this._keysPlayers = [["1", "2", "3", "4"], ["A", "Q", "D", "E"]];
        this._playersColors = ["#ff0000", "#40ff00"];
    }

    get colorsPlayers() {
        return this._playersColors;
    }

    get keys() {
        return this._keysPlayers;
    }
}