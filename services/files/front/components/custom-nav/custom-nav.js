import {Component} from '../component/component.js';
import {ImageButton} from "../image-button/image-button.js";

export class CustomNav extends Component{
    constructor() {
        super();

        ImageButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.shadowRoot.querySelectorAll("image-button").forEach(button => {
            this.addAutoCleanListener(
                button,
                "click",
                () => {
                    window.dispatchEvent(
                        new CustomEvent("openDrawer", {
                            bubbles: true,
                            composed: true,
                            detail: {type: button.id}
                        })
                    );
                }
            );
        });
    }
}