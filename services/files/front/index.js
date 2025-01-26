import { ModeSelector } from "./components/mode-selector/mode-selector.js";
import { CustomNav } from "./components/custom-nav/custom-nav.js";
import { HomeButton } from "./components/home-button/home-button.js";
import { wsService } from "./js/Socket.js";

function loaded() {
    if (wsService.socket === null)
        wsService.socket = "";
}

ModeSelector.register();
CustomNav.register();
HomeButton.register();
window.loaded = loaded;