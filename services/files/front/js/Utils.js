export function resizeCanvas(percentWidth, percentHeight, id, drawingFunction) {
    const rect = this.getBoundingClientRect();
    const canvas = this.shadowRoot.getElementById(id);
    canvas.setAttribute("width", (rect.width * percentWidth).toString());
    canvas.setAttribute("height", (rect.height * percentHeight).toString());
    if (drawingFunction)
        drawingFunction();
}

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

        const observer = new MutationObserver(mutations => {
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