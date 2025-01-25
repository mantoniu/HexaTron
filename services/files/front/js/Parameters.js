export class Parameters {
    constructor() {
        this._keysPlayers = [["a", "q", "e", "d"], ["u", "j", "o", "l"]];
        this._playersColors = ["#ff0000", "#40ff00"];
    }

    get playersColors() {
        return this._playersColors;
    }

    get keys() {
        return this._keysPlayers;
    }
}