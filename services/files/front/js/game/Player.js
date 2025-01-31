export class Player {
    constructor(id, name, color, keyConfiguration, profilePicturePath) {
        this._id = id;
        this._color = color;
        this._name = name;
        this._profilePicturePath = profilePicturePath;
    }

    get profilePicturePath() {
        return this._profilePicturePath;
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
}