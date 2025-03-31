import {ModeSelector} from "./components/mode-selector/mode-selector.js";
import {CustomNav} from "./components/custom-nav/custom-nav.js";
import {HomeButton} from "./components/home-button/home-button.js";
import {GameComponent} from "./components/game-component/game-component.js";
import {DrawerMenu} from "./components/drawer-menu/drawer-menu.js";
import {HexagonBackground} from "./components/hexagon-background/hexagon-background.js";
import {userService} from "./services/user-service.js";
import {GameType} from "./js/game/Game.js";

ModeSelector.register();
CustomNav.register();
HomeButton.register();
GameComponent.register();
DrawerMenu.register();
HexagonBackground.register();

const routes = {
    "/": {
        template: "<mode-selector></mode-selector>",
        authRequired: false
    },
    "/local": {
        template: `<game-component type='${GameType.LOCAL}'></game-component>`,
        authRequired: false
    },
    "/ai": {
        template: `<game-component type='${GameType.AI}'></game-component>`,
        authRequired: false
    },
    "/ranked": {
        template: `<game-component type='${GameType.RANKED}'></game-component>`,
        authRequired: true
    }
};

const navigateTo = (url) => {
    const route = routes[url];

    if (!route) {
        redirectTo("/");
        return;
    }

    if (route.authRequired && !userService.isConnected()) {
        redirectTo("/");
        return;
    }

    history.pushState({path: url}, "", url);
    document.getElementById("outlet").innerHTML = route.template;

    window.dispatchEvent(new CustomEvent("routeChanged", {detail: {route: url}}));
};

const redirectTo = (path) => {
    history.pushState({path}, "", path);
    updateView();
};

const updateView = () => {
    const route = window.location.pathname;
    navigateTo(route);
};

window.addEventListener("navigate", (event) => {
    const route = event.detail.route;
    navigateTo(route);
});

window.onpopstate = () => {
    updateView();
};

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', updateView);
else
    updateView();