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
            if (i === this.actualSlide) indicator.classList.add("active");
            indicator.dataset.index = i;
            this.addAutoCleanListener(indicator, "click", () => this.goToSlide(i));
            if (indicator) {
                indicators.appendChild(indicator);
            }
        }
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
        console.log(i);
        this.actualSlide = i;
        const indicators = this.shadowRoot.getElementById("indicators").childNodes;
        Array.from(indicators).forEach(((element, k) => i === k ? element.classList.add("active") : element.classList.remove("active")));
    }
}