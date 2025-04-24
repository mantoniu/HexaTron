import {Component} from "../component/component.js";
import {TooltipComponent} from "../tooltip-component/tooltip-component.js";

export class CustomButton extends Component {
    constructor() {
        super();

        TooltipComponent.register();

        this.locked = false;
        this.backgroundColor = "white";
        this.padding = "1rem 1.5rem";
    }

    static get observedAttributes() {
        return ["locked", "tooltip-message", "background-color", "padding", "text-color"];
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "locked":
                this.locked = newValue !== null;
                break;
            case "background-color":
                this.backgroundColor = newValue || "white";
                break;
            case "padding":
                this.padding = newValue || "1rem 1.5rem";
                break;
            case "text-color":
                this.textColor = newValue || "#0b0b0b";
                break;
        }

        this.update();
    }

    update() {
        const button = this.shadowRoot.querySelector("button");
        const lockIcon = this.shadowRoot.getElementById("lock-icon");
        const tooltip = this.shadowRoot.getElementById("tooltip");

        if (button) {
            button.disabled = this.locked;

            if (!this.locked)
                button.style.backgroundColor = this.backgroundColor;
            else button.style.backgroundColor = "";

            button.style.color = this.textColor;
            button.style.padding = this.padding;
        }
        if (lockIcon)
            lockIcon.style.display = this.locked ? "inline" : "none";
        if (tooltip)
            tooltip.setAttribute("message", this.getAttribute("tooltip-message"));
    }
}