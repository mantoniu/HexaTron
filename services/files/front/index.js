import { ModeSelector } from "./components/mode-selector/mode-selector.js";
import { CustomNav } from "./components/custom-nav/custom-nav.js";
import { HomeButton } from "./components/home-button/home-button.js";

function loaded() {
    const socket = io(`http://${window.location.hostname}:8000/`, {
        path: "/api/socket.io/"
    });

    socket.on("connect", () => {
        console.log("Connected to server with ID:", socket.id);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected from server");
    });
}

ModeSelector.register();
CustomNav.register();
HomeButton.register();
window.loaded = loaded;