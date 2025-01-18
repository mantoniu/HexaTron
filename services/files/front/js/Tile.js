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

    set akenID(id) {
        this._takenId = id;
    }

    get status() {
        return this._status;
    }

    set status(status) {
        this._status = status;
    }

    get takenId() {
        if (this.status !== Status.Taken) throw new Error("The Tile is not taken by a player");
        return this._takenId;
    }
}