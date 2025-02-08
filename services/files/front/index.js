import {ModeSelector} from "./components/mode-selector/mode-selector.js";
import {CustomNav} from "./components/custom-nav/custom-nav.js";
import {HomeButton} from "./components/home-button/home-button.js";
import {GameComponent} from "./components/game-component/game-component.js";

ModeSelector.register();
CustomNav.register();
HomeButton.register();
GameComponent.register();

const routes = {
    "/": "<mode-selector></mode-selector>",
    "/game": "<game-component></game-component>",
};

function navigateTo(url) {
    if (routes[url]) {
        history.pushState({path: url}, "", url);
        document.getElementById("outlet").innerHTML = routes[url];

        updateActiveLink();
    } else {
        document.getElementById("outlet").innerHTML = "<h1>404 - Page non trouvée</h1>";
    }
}

window.addEventListener("navigate", (event) => {
    const route = event.detail.route;
    navigateTo(route);
});

window.onpopstate = () => {
    document.getElementById("outlet").innerHTML = routes[window.location.pathname] || "<h1>404 - Page non trouvée</h1>";
};

function updateActiveLink() {
    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle("active", button.getAttribute("data-route") === window.location.pathname);
    });
}

navigateTo(window.location.pathname);