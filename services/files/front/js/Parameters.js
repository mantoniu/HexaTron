export class Parameters {
    constructor() {
        this.keysPlayers = [["1", "2", "3", "4"], ["A", "Q", "D", "E"]];
        this.colorsPlayers = ["#ff0000", "#40ff00"];
    }

    get getColorsPlayers() {
        return this.colorsPlayers;
    }

    get getKeys() {
        return this.keysPlayers;
    }
}