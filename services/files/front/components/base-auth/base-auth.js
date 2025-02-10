import {Component} from "../component/component.js";
import {FormInput} from "../form-input/form-input.js";
import {checkRequired, getInputsData} from "../../js/FormUtils.js";

export class BaseAuth extends Component {
    constructor() {
        super();

        FormInput.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        const form = this.shadowRoot.querySelector('form');
        if (form) {
            form.addEventListener('submit', (event) => {
                if (!this.checkValidity()) {
                    event.preventDefault();
                } else {
                    this.handleSubmit();
                }
            });
        }
    }

    checkValidity() {
        return checkRequired(this.shadowRoot.querySelectorAll("form-input[required]"));
    }

    handleSubmit() {
        console.warn("handleSubmit must be implemented by the child class.");
    }

    getFormData() {
        const formInputs = this.shadowRoot.querySelectorAll("form-input");
        return getInputsData(formInputs);
    }
}