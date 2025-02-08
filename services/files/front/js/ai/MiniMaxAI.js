import {AI} from "./AI.js";
import {MiniMaxClass} from "./MiniMaxClass.js";

export class MiniMaxAI extends AI {
    constructor(id, name, color) {
        super(id, name, color, "../../assets/bot.svg", false);
        this.bot = new MiniMaxClass();
    }

    setup(playerState) {
        return this.bot.setup(playerState);
    }

    nextMove(playerState) {
        return this.bot.nextMove(playerState);
    }
}