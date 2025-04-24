let url = "https://hexatron.ps8.pns.academy";

export let hapticImpact = async () => {
};

export let hapticNotification = async () => {
};

export let hapticVibration = async () => {
};

export const mobile = Capacitor.isNativePlatform();

if (mobile) {
    const {EnvPlugin, Haptics, App} = Capacitor.Plugins;
    if (EnvPlugin) {
        const {apiUrl} = await EnvPlugin.getApiUrl();
        url = apiUrl;
    }
    if (Haptics) {
        // When playing a game is found
        hapticVibration = async () => {
            await Haptics.vibrate();
        };

        // When the user modifies something and a popup is shown, or when the user receives a notification
        hapticNotification = async () => {
            await Haptics.notification();
        };

        //When the user loses a round
        hapticImpact = async () => {
            await Haptics.impact();
        };
    }
    if (App) {
        App.addListener("backButton", ({canGoBack}) => {
            const drawerMenu = document.querySelector("drawer-menu");
            if (document.querySelector("game-component")) {
                window.history.back();
            } else if (drawerMenu.open) {
                drawerMenu.closeButton().click();
            } else {
                const confirmExit = window.confirm("Quitter l’application ?");
                if (confirmExit) {
                    App.exitApp();
                }
            }
        });

    }
}


export const API_HOST = Capacitor.getPlatform() === "web"
    ? window.location.origin
    : url;