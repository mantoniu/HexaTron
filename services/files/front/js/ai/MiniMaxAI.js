import {AI} from "./AI.js";
import {nextMove, setup} from "./MiniMax.js";

export class MiniMaxAI extends AI {
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