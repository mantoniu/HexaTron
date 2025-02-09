import {GameType} from "./Game.js";
import {LocalPlayer} from "./LocalPlayer.js";
import {WallHuggerAI} from "../ai/WallHuggerAI.js";

export class PlayerFactory {
    static createPlayer(type, id, color, keys = null) {
        switch (type) {
            case GameType.LOCAL:
                return new LocalPlayer(id, "Guest " + id, color, "", keys);
            case GameType.AI:
                return new WallHuggerAI(id, "IA " + id, color);
            default:
                throw new Error(`Unsupported player type: ${type}`);
        }
    }
}