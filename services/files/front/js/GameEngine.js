import { Game } from "./Game.js";
import { Player } from "./Player.js";
import { Parameters } from "./Parameters.js";

export const GameType = {
    LOCAL: 0,
    IA: 1,
    RANKED: 2
};

export class GameEngine {
    constructor(type) {
        this._type = type;
        let parameters = new Parameters();
        let player1 = new Player("0", "Player 1", "", parameters);
        let player2 = new Player("1", "Player 2", "", {});
        this._game = new Game(9, 16, [player1, player2]);
    }
}