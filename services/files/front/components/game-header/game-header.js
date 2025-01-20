import { Component } from "../component/component.js";
import { resizeCanvas } from "../../js/Utils.js";

export class GameHeader extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        resizeCanvas(this, 0.2, 1, "header");
        window.addEventListener("resize", resizeCanvas.bind(this, this, 0.2, 1, "header"));
    }

    disconnectedCallback() {
        window.removeEventListener("resize", resizeCanvas.bind(this, this, 0.2, 1, "header"));
    }
}