let url = "https://hexatron.ps8.pns.academy";

export const mobile = Capacitor.isNativePlatform();

if (mobile) {
    const {EnvPlugin} = Capacitor.Plugins;
    if (EnvPlugin) {
        const {apiUrl} = await EnvPlugin.getApiUrl();
        url = apiUrl;
    }
}


export const API_HOST = Capacitor.getPlatform() === "web"
    ? window.location.origin
    : url;