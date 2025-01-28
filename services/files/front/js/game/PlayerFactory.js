import {GameType} from "./Game.js";
import {LocalPlayer} from "./LocalPlayer.js";

export class PlayerFactory {
    static createPlayer(type, id, color, keys = null) {
        switch (type) {
            case GameType.LOCAL:
                return new LocalPlayer(id, "Guest " + id, color, null, keys);
            default:
                throw new Error(`Unsupported player type: ${type}`);
        }
    }
}