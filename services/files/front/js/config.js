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
    const {EnvPlugin, Haptics, PushNotifications} = Capacitor.Plugins;
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

    if (PushNotifications) {
        PushNotifications.requestPermissions().then(result => {
            if (result.receive === 'granted') {
                userService.on(USER_EVENTS.CONNECTION, async () =>
                    PushNotifications.register());

                userService.on(USER_EVENTS.LOGOUT, async () =>
                    PushNotifications.unregister());
            } else console.error("Unable to get access to the notifications");
        });

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration', async (token) =>
            await userService.updateNotificationToken({notificationToken: token.value}));

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