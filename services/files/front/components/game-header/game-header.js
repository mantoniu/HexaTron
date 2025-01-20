import { Component } from "../component/component.js";
import { convertRemToPixels, resizeCanvas } from "../../js/Utils.js";

export class GameHeader extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        resizeCanvas(this, 0.2, 1, "header", this.draw, this);
        window.addEventListener("resize", resizeCanvas.bind(this, this, 0.2, 1, "header", this.draw, this));
    }

    disconnectedCallback() {
        window.removeEventListener("resize", resizeCanvas.bind(this, this, 0.15, 1, "header", this.draw, this));
    }

    draw(callingContext) {
        const canvas = callingContext.shadowRoot.getElementById("header");
        const context = canvas.getContext("2d");
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const pxSize = convertRemToPixels(1.5);
        context.font = pxSize + "px serif";
        const size = context.measureText("2").fontBoundingBoxAscent - context.measureText("2").fontBoundingBoxDescent;

        for (var k = 1; k < 4; k++) {
            context.beginPath();
            context.arc(k * width / 4, height / 2, size, 0, 2 * Math.PI, true);
            context.stroke();

            const center = context.measureText(k).width;
            context.fillText(k, k * width / 4 - center / 2, height / 2 + size / 2);

            if (k !== 3) {
                context.beginPath();
                context.moveTo(k * width / 4 + size, height / 2);
                context.lineTo((k + 1) * width / 4 - size, height / 2);
                context.stroke();
            }
        }
    }
}