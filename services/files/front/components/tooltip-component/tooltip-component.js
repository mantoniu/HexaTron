import {Component} from "../component/component.js";

export class TooltipComponent extends Component {
    constructor() {
        super();

    }

    static get observedAttributes() {
        return ["default-activated", "message", "space", "position", "width", "height", "wrap", "arrow"];
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._tooltip = this.shadowRoot.getElementById("tooltip");
        this.update();
    }

    update() {
        const activated = JSON.parse(this.getAttribute("default-activated"));
        if (!activated) {
            this.hideTooltip();
        }

        const message = this.getAttribute("message");
        console.log(message);
        if (message === "null") {
            this.style.display = "none";
            return;
        } else
            this._tooltip.innerText = message;

        const arrow = this.getAttribute("arrow");
        if (!arrow || arrow === "false") {
            this._tooltip.style.setProperty("--tooltip-arrow-content", "none");
        } else
            this._tooltip.style.setProperty("--tooltip-arrow-content", "");

        const wrap = this.getAttribute("wrap");
        if (!wrap) {
            this._tooltip.style.whiteSpace = "nowrap";
        } else
            this._tooltip.style.whiteSpace = wrap;

        this._tooltip.style.height = this.getAttribute("height") || "fit-content";
        this._tooltip.style.width = this.getAttribute("width") || "fit-content";

        this.updatePosition();
    }

    updatePosition() {
        const position = this.getAttribute("position") || "top";
        let target;
        if (this.assignedSlot) {
            target = this.parentNode;
        } else
            target = this.previousElementSibling;
        if (!target) {
            return;
        }

        if (!JSON.parse(this.getAttribute("default-activated"))) {
            this.addAutoCleanListener(target, "mouseenter", this.showTooltip.bind(this));
            this.addAutoCleanListener(target, "mouseleave", this.hideTooltip.bind(this));
        }

        const spacing = JSON.parse(this.getAttribute("space")) || 8;

        this._tooltip.style.top = "";
        this._tooltip.style.left = "";
        this._tooltip.style.right = "";
        this._tooltip.style.bottom = "";

        switch (position) {
            case "top-left":
                this._tooltip.style.bottom = `calc(100% + ${spacing}px)`;
                this._tooltip.style.right = `calc(50% + ${spacing}px)`;

                break;
            case "top-right":
                this._tooltip.style.bottom = `calc(100% + ${spacing}px)`;
                this._tooltip.style.left = `calc(50% + ${spacing}px)`;

                break;
            case "bottom-left":
                this._tooltip.style.top = `calc(100% + ${spacing}px)`;
                this._tooltip.style.right = `calc(50% + ${spacing}px)`;

                break;
            case "bottom-right":
                this._tooltip.style.top = `calc(100% + ${spacing}px)`;
                this._tooltip.style.left = `calc(50% + ${spacing}px)`;

                break;
            case "top":
                this._tooltip.style.bottom = `calc(100% + ${spacing}px)`;
                this._tooltip.style.left = `50%`;
                this._tooltip.style.transform = `translateX(-50%)`;
                break;
            case "bottom":
                this._tooltip.style.top = `calc(100% + ${spacing}px)`;
                this._tooltip.style.left = `50%`;
                this._tooltip.style.transform = `translateX(-50%)`;
                break;
            case "left":
                this._tooltip.style.bottom = `50%`;
                this._tooltip.style.right = `calc(100% + ${spacing}px)`;
                this._tooltip.style.transform = `translateY( -50%)`;
                break;
            case "right":
            default:
                this._tooltip.style.bottom = `50%`;
                this._tooltip.style.left = `calc(100% + ${spacing}px)`;
                this._tooltip.style.transform = `translateY(-50%)`;
                break;
        }
    }

    showTooltip() {
        this._tooltip.style.opacity = 1;
        this._tooltip.style.visibility = "visible";
    }

    hideTooltip() {
        this._tooltip.style.opacity = 0;
        this._tooltip.style.visibility = "hidden";
    }
}