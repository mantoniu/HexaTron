import {Component} from "../component/component.js";
import {ImageButton} from "../image-button/image-button.js";
import {InformationComponent} from "../information-component/information-component.js";

export class HomePageButton extends Component {
    constructor() {
        super();

        ImageButton.register();
        InformationComponent.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        const imageButton = this.shadowRoot.querySelector("image-button");
        imageButton.setAttribute("alt", this.getAttribute("alt"));
        imageButton.setAttribute("src", this.getAttribute("src"));
        imageButton.style.width = this.hasAttribute("width") ? this.getAttribute("width") : "var(--button-image-size)";
        imageButton.style.height = this.hasAttribute("height") ? this.getAttribute("height") : "var(--button-image-size)";

        if (this.hasAttribute("top"))
            this.style.top = this.getAttribute("top");
        if (this.hasAttribute("bottom"))
            this.style.bottom = this.getAttribute("bottom");
        if (this.hasAttribute("left"))
            this.style.left = this.getAttribute("left");
        if (this.hasAttribute("right"))
            this.style.right = this.getAttribute("right");
    }
}