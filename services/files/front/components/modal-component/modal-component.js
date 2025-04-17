import {Component} from "../component/component.js";
import {SubmitButton} from "../submit-button/submit-button.js";

export class ModalComponent extends Component {
    constructor() {
        super();

        SubmitButton.register();
        this.totalSlide = 5;
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._initialize();
    }

    _initialize() {
        this.actualSlide = 0;
        const shadowRoot = this.shadowRoot;
        const indicators = shadowRoot.getElementById("indicators");
        for (let i = 0; i < this.totalSlide; i++) {
            const indicator = document.createElement("div");
            indicator.classList.add("indicator");
            this.addAutoCleanListener(indicator, "click", () => this.goToSlide(i));
            if (indicator) {
                indicators.appendChild(indicator);
            }
        }
        this.goToSlide(this.actualSlide);
        const next = shadowRoot.getElementById("next");
        if (next)
            this.addAutoCleanListener(next, "click", () => this.goToSlide(this.actualSlide + 1));
        const previous = shadowRoot.getElementById("previous");
        this.addAutoCleanListener(previous, "click", () => this.goToSlide(this.actualSlide - 1));

        const closeButton = this.shadowRoot.getElementById("close-btn");
        if (closeButton)
            closeButton.addEventListener("click", () => this.remove());
    }

    goToSlide(i) {
        this.actualSlide = i;
        const indicators = this.shadowRoot.getElementById("indicators").childNodes;
        Array.from(indicators).forEach(((element, k) => i === k ? element.classList.add("active") : element.classList.remove("active")));

        const next = this.shadowRoot.getElementById("next");
        const previous = this.shadowRoot.getElementById("previous");
        next.style.visibility = "visible";
        previous.style.visibility = "visible";
        if (i === this.totalSlide - 1)
            next.style.visibility = "hidden";
        else if (i === 0)
            previous.style.visibility = "hidden";
    }
}