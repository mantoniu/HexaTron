export function resizeCanvas(context, percentWidth, percentHeight, id, drawingFunction, callingContext) {
    const rect = context.getBoundingClientRect();
    const canvas = context.shadowRoot.getElementById(id);
    canvas.setAttribute("width", rect.width * percentWidth);
    canvas.setAttribute("height", rect.height * percentHeight);
    console.log(drawingFunction);
    if (drawingFunction !== null) {
        drawingFunction(callingContext);
    }
}

export function convertRemToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}