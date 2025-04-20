import {Component} from "../component/component.js";
import {ImageButton} from "../image-button/image-button.js";
import {InformationComponent} from "../information-component/information-component.js";

const BUTON_TYPE = {
    HOME: "home",
    INFOS: "infos"
};

export class HomePageButton extends Component {
    constructor() {
        super();

        ImageButton.register();
        InformationComponent.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        let listener;
        switch (this.getAttribute("type")) {
            case BUTON_TYPE.INFOS:
                listener = this._createModalComponent;
                break;
            case BUTON_TYPE.HOME:
            default:
                listener = () => {
                    if (window.location.pathname !== "/") {
                        window.dispatchEvent(new CustomEvent("navigate", {
                            detail: {route: `/`}
                        }));
                    }
                }
        }

        this.addAutoCleanListener(this, "click", listener);

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

    _createModalComponent() {
        const modalComponent = document.createElement("information-component");
        document.body.appendChild(modalComponent);
    }
}