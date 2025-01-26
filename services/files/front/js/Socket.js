class WebSocketService {
    constructor() {
        this._socket = null;
    }

    get socket() {
        return this._socket;
    }

    set socket(url) {
        this._socket = io(`http://${window.location.hostname}:8000/`, {
            path: "/api/socket.io/"
        });

        this._socket.on("connect", () => {
            console.log("user connected " + this._socket.id);
        });

        this._socket.on("disconnect", () => {
            console.log("user disconnected");
        });

        this._socket.on("hello", (message) => {
            console.log(message);
        });

        this._socket.on("reconnect", () => {
            console.log("Reconnected to server");
        });

        this._socket.on("connect_error", (error) => {
            console.log("Connection error:", error);
        });
    }
}

export const wsService = new WebSocketService();


