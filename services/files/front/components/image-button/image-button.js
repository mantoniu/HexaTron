import {Component} from "../component/component.js";

export class ImageButton extends Component {
    constructor() {
        super();

        this.src = null;
        this.alt = "";
    }

    static get observedAttributes() {
        return ['src', 'alt', 'span'];
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.checkSrc();
        this.update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "src":
                this.src = newValue;
                break;
            case "alt":
                this.alt = newValue;
                break;
            case "span":
                this.span = newValue;
                break;
        }

        this.update();
    }

    checkSrc() {
        if (!this.src)
            console.warn(
                `The <image-button> component has been initialized without the "src" attribute.`,
                this);
    }

    update() {
        const imgElement = this.shadowRoot.querySelector('img');
        const hasTitle = !!this.span?.trim();

        if (imgElement) {
            imgElement.setAttribute('src', this.src);
            imgElement.setAttribute('alt', this.alt);
            imgElement.classList.toggle('full-height', !hasTitle);
            imgElement.classList.toggle('with-title', hasTitle);
        }

        const span = this.shadowRoot.querySelector('span');
        if (span) {
            span.textContent = hasTitle ? this.span : '';
            span.style.display = hasTitle ? 'block' : 'none';
        }
    }
}