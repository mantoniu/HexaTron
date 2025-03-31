import {AlertMessage} from "../components/alert-message/alert-message.js";

export function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function hexToRGB(hex) {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5), 16);
    return [r, g, b];
}

export function rgbToHex([r, g, b]) {
    let red = r.toString(16).padStart(2, "0");
    let green = g.toString(16).padStart(2, "0");
    let blue = b.toString(16).padStart(2, "0");
    return "#" + red + green + blue;
}

export async function waitForElm(context, id) {
    return new Promise(resolve => {
        if (context.shadowRoot.getElementById(id)) {
            return resolve(context.shadowRoot.getElementById(id));
        }

        const observer = new MutationObserver(() => {
            if (context.shadowRoot.getElementById(id)) {
                observer.disconnect();
                resolve(context.shadowRoot.getElementById(id));
            }
        });

        observer.observe(context.shadowRoot, {
            childList: true,
            subtree: true
        });
    });
}

export function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

/**
 * Creates and displays an alert message inside the specified container.
 *
 * @param {HTMLElement} container - The container where the alert message will be displayed.
 * @param {string} type - The type of the alert.
 * @param {string} text - The text content of the alert message.
 * @param {number} [timer=4000] - The duration (in milliseconds) before the alert disappears.
 * @returns {HTMLElement|null} The created alert message element, or null if no container is provided.
 */
export function createAlertMessage(container, type, text, timer = 4000) {
    AlertMessage.register();

    if (!container)
        return null;

    let existingAlert = container.querySelector("alert-message");
    if (existingAlert)
        existingAlert.remove();

    const alert = document.createElement("alert-message");

    alert.setAttribute("type", type);
    alert.setAttribute("timer", timer.toString());
    alert.innerText = text;

    container.appendChild(alert);
    return alert;
}