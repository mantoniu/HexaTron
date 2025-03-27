import {Component} from "../component/component.js";
import {SubmitButton} from "../submit-button/submit-button.js";

export class ModalDialog extends Component {
    constructor() {
        super();

        SubmitButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._initialize();
    }

    _initialize() {
        const titleElem = this.shadowRoot.getElementById("title");
        const cancelButton = this.shadowRoot.getElementById("cancel");
        const deleteButton = this.shadowRoot.getElementById("delete");

        if (cancelButton)
            cancelButton.addEventListener("click", () => this.remove());

        if (deleteButton)
            deleteButton.addEventListener("click", () => {
                this.dispatchEvent(new CustomEvent("action"));
                this.remove();
            });

        if (titleElem)
            titleElem.innerText = this.getAttribute("modal-title") || "";
    }
}