import {Component} from "../component/component.js";

export class PopupComponent extends Component {
    constructor() {
        super();
        this.isOpen = false;
        this.autoCloseTimer = null;
        this.description = "";
        this.color = "";
    }

    static get observedAttributes() {
        return ["text", "color"];
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupEventListeners();
        this.update();
    }

    setupEventListeners() {
        this.addAutoCleanListener(this.shadowRoot.querySelector("#close-button"), "click", () => this.close());
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "text":
                this.description = newValue;
                break;
            case "color":
                this.color = `2px ${newValue} solid`;
                break;
        }

        this.update();
    }

    update() {
        if (this.isConnected) {
            if (this.shadowRoot.getElementById("description")) {
                this.shadowRoot.getElementById("description").textContent = this.description;
            }
            if (this.shadowRoot.getElementById("popup-container")) {
                this.shadowRoot.getElementById("popup-container").style.border = this.color;
            }
        }
    }

    open() {
        this.style.display = "flex";

        setTimeout(() => {
            this.classList.add("visible");
        }, 10);

        this.isOpen = true;

        this.startAutoCloseTimer();
    }

    startAutoCloseTimer() {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
        }

        this.classList.add("closing");

        this.autoCloseTimer = setTimeout(() => {
            this.close();
        }, 10000);
    }

    close() {
        if (this.autoCloseTimer) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }

        this.classList.remove("visible");

        setTimeout(() => {
            this.style.display = "none";
            this.classList.remove("closing");
        }, 500);

        this.isOpen = false;
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    }
}