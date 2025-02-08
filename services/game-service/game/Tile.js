const Status = {
    WALL: -1,
    VACANT: 0,
    TAKEN: 1
};

class Tile {
    constructor(status) {
        this.status = status;
        this.takenID = null;
    }

    get takenID() {
        if (this.status !== Status.TAKEN) throw new Error("The Tile is not taken by a player");
        return this._takenID;
    }

    set takenID(id) {
        this._takenID = id;
    }

    get status() {
        return this._status;
    }

    set status(status) {
        this._status = status;
    }
}

module.exports = {Tile, Status};