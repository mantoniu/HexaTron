export class User {
    constructor(id, name, profilePicturePath, parameters) {
        this._id = id;
        this._name = name;
        this._profilePicturePath = profilePicturePath;
        this._parameters = parameters;
    }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }

    get id() {
        return this._id;
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