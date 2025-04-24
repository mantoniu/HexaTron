let url = "https://hexatron.ps8.pns.academy";

export let hapticImpact = async () => {
};

export let hapticNotification = async () => {
};

export let hapticVibration = async () => {
};

export const mobile = Capacitor.isNativePlatform();

if (mobile) {
    const {EnvPlugin, Haptics} = Capacitor.Plugins;
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
}


export const API_HOST = Capacitor.getPlatform() === "web"
    ? window.location.origin
    : url;