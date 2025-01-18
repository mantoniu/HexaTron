export class Player {

    constructor(id, name, profilePicturePath, parameters) {
        this.id = id;
        this.name = name;
        this.profilePicturePath = profilePicturePath;
        this.parameters = parameters;
    }

    get getName() {
        return this.name;
    }

    get getProfilePicturePath() {
        return this.profilePicturePath;
    }

    set setParameters(parameters) {
        this.parameters = parameters;
    }

    get getParameters() {
        return this.parameters;
    }

}