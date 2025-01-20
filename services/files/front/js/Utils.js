export function resizeCanvas(context, percentWidth, percentHeight, id) {
    const rect = context.getBoundingClientRect();
    const canvas = context.shadowRoot.getElementById(id);
    canvas.setAttribute("width", rect.width * percentWidth);
    canvas.setAttribute("height", rect.height * percentHeight);
}