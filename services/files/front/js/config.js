import {USER_EVENTS, userService} from "../services/user-service.js";

let url = "https://hexatron.ps8.pns.academy";

export let hapticImpact = async () => {
};

export let hapticNotification = async () => {
};

export let hapticVibration = async () => {
};

export const mobile = Capacitor.isNativePlatform();

if (mobile) {
    const {EnvPlugin, Haptics, App, PushNotifications} = Capacitor.Plugins;

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

    if (PushNotifications) {
        PushNotifications.requestPermissions().then(result => {
            if (result.receive === 'granted') {
                if (userService.isConnected())
                    PushNotifications.register();

                userService.on(USER_EVENTS.CONNECTION, async () =>
                    PushNotifications.register());

                userService.on(USER_EVENTS.LOGOUT, async () =>
                    PushNotifications.unregister());
            } else console.error("Unable to get access to the notifications");
        });

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration', async (token) =>
            await userService.updateNotificationToken(token.value));

        // Some issue with our setup and push will not work
        PushNotifications.addListener('registrationError',
            (error) => console.error('Error on registration: ' + JSON.stringify(error)));

        // Show us the notification payload if the app is open on our device
        PushNotifications.addListener('pushNotificationReceived',
            (notification) => console.log('Push received: ' + JSON.stringify(notification)));

        // Method called when tapping on a notification
        PushNotifications.addListener('pushNotificationActionPerformed',
            (notification) => console.log('Push action performed: ' + JSON.stringify(notification)));
    }
}

export const API_HOST = Capacitor.getPlatform() === "web"
    ? window.location.origin
    : url;