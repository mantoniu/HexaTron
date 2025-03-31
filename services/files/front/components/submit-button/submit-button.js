import {Component} from "../component/component.js";

export class SubmitButton extends Component {
    async connectedCallback() {
        await super.connectedCallback();

        this._submitButton = this.shadowRoot.getElementById("submit-button");
        this._initialize();
    }

    _initialize() {
        const borderColor = this.getAttribute("border-color") || "transparent";
        const backgroundColor = this.getAttribute("background-color") || "var(--primary-blue)";
        const color = this.getAttribute("color") || "white";
        const hoverColor = this.getAttribute("background-hover-color") || "var(--primary-blue-dark)";

        if (borderColor)
            this._submitButton.style.borderColor = borderColor;
        this._submitButton.style.backgroundColor = backgroundColor;
        this._submitButton.style.color = color;

        this._submitButton.addEventListener("mouseover", () => {
            this._submitButton.style.backgroundColor = hoverColor;
        });

        this._submitButton.addEventListener("mouseleave", () => {
            this._submitButton.style.backgroundColor = backgroundColor;
        });
    }
}