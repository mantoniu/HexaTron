export const Status = {
    Wall: -1,
    Vacant: 0,
    Taken: 1
};

export class Tile {
    constructor(status) {
        this.status = status;
        this.takenId = "";
    }

    set setValue(status) {
        this.status = status;
    }

    set setTakenID(id) {
        this.takenId = id;
    }

    get getStatus() {
        return this.status;
    }

    get getTakenId() {
        if (this.status !== Status.Taken) throw new Error("The Tile is not taken by a player");
        return this.takenId;
    }
}