import {ModeSelector} from "./components/mode-selector/mode-selector.js";
import {CustomNav} from "./components/custom-nav/custom-nav.js";
import {HomeButton} from "./components/home-button/home-button.js";
import {GameComponent} from "./components/game-component/game-component.js";
import {DrawerMenu} from "./components/drawer-menu/drawer-menu.js";
import {chatService} from "./services/chat-service.js";

ModeSelector.register();
CustomNav.register();
HomeButton.register();
GameComponent.register();
DrawerMenu.register();

const routes = {
    "/": "<mode-selector></mode-selector>",
    "/game": "<game-component></game-component>",
};

function navigateTo(url) {
    if (routes[url]) {
        history.pushState({path: url}, "", url);
        document.getElementById("outlet").innerHTML = routes[url];
    } else {
        document.getElementById("outlet").innerHTML = "<h1>404 - Not found</h1>";
    }
}

window.addEventListener("navigate", (event) => {
    const route = event.detail.route;
    navigateTo(route);
});

function updateView() {
    const route = window.location.pathname;
    if (routes[route]) {
        document.getElementById("outlet").innerHTML = routes[route];
    } else {
        document.getElementById("outlet").innerHTML = "<h1>404 - Not found</h1>";
    }
}

window.onpopstate = () => {
    updateView();
    const routeChangeEvent = new CustomEvent("routeChange");
    window.dispatchEvent(routeChangeEvent);
};

updateView();

window.chatService = chatService;