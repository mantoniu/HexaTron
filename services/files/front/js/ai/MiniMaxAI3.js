import {AI} from "./AI.js";
import {nextMove, setup} from "./MiniMax3.js";

export class MiniMaxAI3 extends AI {
    constructor(id, name, color) {
        super(id, name, color, "../../assets/bot.svg", false);
    }

    setup(playerState) {
        return setup(playerState);
    }

    nextMove(playerState) {
        return nextMove(playerState);
    }
}