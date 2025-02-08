class Player {
    constructor(id, name, socketId) {
        this._id = id;
        this._name = name;
        this._socketId = socketId;
    }

    get color() {
        return this._color;
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

module.exports = Player;