const PlayerType = {
    NORMAL: 0,
    AI: 1,
};

class Player {
    constructor(id, name, socketId) {
        this._id = id;
        this._name = name;
        this._socketId = socketId;
    }

    get playerType() {
        return PlayerType.NORMAL;
    }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get socketId() {
        return this._socketId;
    }
}

module.exports = {Player, PlayerType};