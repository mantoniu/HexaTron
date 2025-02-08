const {GameType} = require("./Game.js");
const RemotePlayer = require("./RemotePlayer.js");

class PlayerFactory {
    static createPlayer(type, id, color, keys = null) {
        switch (type) {
            case GameType.LOCAL:
            case GameType.RANKED:
                return new RemotePlayer(id, "Guest " + id, color, "", keys);
            default:
                throw new Error(`Unsupported player type: ${type}`);
        }
    }
}

module.exports = PlayerFactory;