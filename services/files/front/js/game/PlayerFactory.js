import {GameType} from "./Game.js";
import {LocalPlayer} from "./LocalPlayer.js";
import {RandomAI} from "../ai/RandomAI.js";

export class PlayerFactory {
    static createPlayer(type, id, color, keys = null) {
        switch (type) {
            case GameType.LOCAL:
                return new LocalPlayer(id, "Guest " + id, color, null, keys);
            case GameType.AI:
                return new RandomAI(id, "AI " + id, color);
            default:
                throw new Error(`Unsupported player type: ${type}`);
        }
    }
}