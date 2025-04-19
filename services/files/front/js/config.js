export const API_HOST = Capacitor.getPlatform() === "web"
    ? window.location.origin
    : "https://hexatron.ps8.pns.academy";