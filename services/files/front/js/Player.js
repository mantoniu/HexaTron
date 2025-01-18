export class Player {
    constructor(id, name, profilePicturePath, parameters) {
        this._id = id;
        this._name = name;
        this._profilePicturePath = profilePicturePath;
        this.parameters = parameters;
    }

    get name() {
        return this._name;
    }

    get profilePicturePath() {
        return this._profilePicturePath;
    }

    get parameters() {
        return this._parameters;
    }

    set parameters(parameters) {
        this._parameters = parameters;
    }
}