import { Component } from "../component/component.js";
import { convertRemToPixels, hexToRGB, resizeCanvas, rgbToHex, waitForElm } from "../../js/Utils.js";

export class GameHeader extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        this.resizeCanvasFunction = resizeCanvas.bind(this, 0.2, 1, "header", this.draw, this);
        this.resizeCanvasFunction.call();

        window.addEventListener("resize", this.resizeCanvasFunction);
    }

    disconnectedCallback() {
        window.removeEventListener("resize", this.resizeCanvasFunction);
    }

    calculateUtils() {
        const canvas = this.shadowRoot.getElementById("header");
        const context = canvas.getContext("2d");
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const pxSize = convertRemToPixels(1.5);
        context.font = pxSize + "px serif";
        const size = context.measureText("2").fontBoundingBoxAscent - context.measureText("2").fontBoundingBoxDescent;
        return [context, width, height, size];
    }

    drawCircle(n, color, fill) {
        const [context, width, height, size] = this.calculateUtils();
        context.fillStyle = color;
        context.beginPath();
        context.arc(n * width / 4, height / 2, size, 0, 2 * Math.PI, true);

        fill ? context.fill() : context.stroke();

        const backGroundRGB = hexToRGB(context.fillStyle);
        const luminosityBackground = (backGroundRGB[0] * 299 + backGroundRGB[1] * 587 + backGroundRGB[2] * 114) / 1000;
        context.fillStyle = rgbToHex([luminosityBackground < 128 ? 255 : 0, luminosityBackground < 128 ? 255 : 0, luminosityBackground < 128 ? 255 : 0]);

        const center = context.measureText(n).width;
        context.fillText(n, n * width / 4 - center / 2, height / 2 + size / 2);
    }

    draw(callingContext) {
        const [context, width, height, size] = callingContext.calculateUtils();
        for (let k = 1; k < 4; k++) {
            callingContext.drawCircle(k, "#fff", false);
            if (k !== 3) {
                context.beginPath();
                context.moveTo(k * width / 4 + size, height / 2);
                context.lineTo((k + 1) * width / 4 - size, height / 2);
                context.stroke();
            }
        }
    }

    fillCircle(n, color) {
        this.drawCircle(n, color, true);
    }

    async receiveData(entry) {
        for (let k = 1; k <= entry.length; k++) {
            waitForElm(this, "name-player" + k).then((element) => {
                element.innerText = entry[k - 1]._name;
            });

            waitForElm(this, "pp-player" + k).then((element) => {
                if (element) {
                    if (entry[k - 1]._profilePicturePath === "")
                        element.src = "../../assets/profile.svg";
                    else
                        element.src = entry[k - 1]._profilePicturePath;
                }
            });
        }
    }
}
