import {Component} from "../component/component.js";

export class SubmitButton extends Component {
    async connectedCallback() {
        await super.connectedCallback();

        this.addAutoCleanListener(this.shadowRoot.getElementById("submit-button"), "click",
            () => this.closest("form").dispatchEvent(new Event("submit")));
    }
}