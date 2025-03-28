export class User {
    constructor(id, name, profilePicturePath, parameters, friends) {
        this._id = id;
        this.name = name;
        this.profilePicturePath = profilePicturePath;
        this.parameters = parameters;
        this.friends = friends;
    }
}