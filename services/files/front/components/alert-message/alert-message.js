import {Component} from "../component/component.js";

const colors = {
    success: {
        background: "#d4f8d4",
        border: "#2d862d",
        text: "#2d862d"
    },
    error: {
        background: "#f8d7da",
        border: "#d9534f",
        text: "#d9534f"
    }
};

export class AlertMessage extends Component {
    async connectedCallback() {
        await super.connectedCallback();

        this._closeButton = this.shadowRoot.getElementById("close-btn");
        this._initialize();
    }

    _initialize() {
        const colorType = this.getAttribute("type") || "success";
        const timer = parseInt(this.getAttribute("timer"), 10) || null;

        const {background, border, text} = colors[colorType] || colors.success;

        this.style.backgroundColor = background;
        this.style.borderColor = border;
        this.style.color = text;

        this._closeButton.addEventListener("click", () => {
            this.remove();
        });

        if (timer) {
            setTimeout(() => {
                this.remove();
            }, timer);
        }
    }
}