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

const routes = [
    {
        path: "/",
        template: () => "<mode-selector></mode-selector>",
        authRequired: false,
        onNavigate: () => window.dispatchEvent(new CustomEvent("resetCustomNav"))
    },
    {
        path: "/local",
        template: () => `<game-component type='${GameType.LOCAL}'></game-component>`,
        authRequired: false
    },
    {
        path: "/ai",
        template: () => `<game-component type='${GameType.AI}'></game-component>`,
        authRequired: false
    },
    {
        path: "/ranked",
        template: () => `<game-component type='${GameType.RANKED}'></game-component>`,
        authRequired: true
    },
    {
        path: "/friendly",
        template: (params) => `<game-component type='${GameType.FRIENDLY}' params='${JSON.stringify(params)}'></game-component>`,
        authRequired: true,
        validateParams: (params) => params.friendId || params.gameId
    }
];

const navigateTo = (url, params = {}) => {
    const matchedRoute = routes.find(route => route.path === url);

    if (!matchedRoute) {
        redirectTo("/");
        return;
    }

    if (matchedRoute.authRequired && !userService.isConnected()) {
        redirectTo("/");
        return;
    }

    if (matchedRoute.validateParams && !matchedRoute.validateParams(params)) {
        redirectTo("/");
        return;
    }

    history.pushState({path: url}, "", url);
    document.getElementById("outlet").innerHTML = matchedRoute.template(params);
    window.dispatchEvent(new CustomEvent("routeChanged", {detail: {route: url, params}}));

    if (matchedRoute.onNavigate)
        matchedRoute.onNavigate();

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
    const {route, params} = event.detail;
    navigateTo(route, params);
});

window.onpopstate = () => {
    updateView();
};

if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', updateView);
else
    updateView();