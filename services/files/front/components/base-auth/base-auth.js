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

        const submitButton = this.shadowRoot.querySelector('submit-button');
        if (submitButton) {
            submitButton.addEventListener('click', () => {
                if (!this.checkValidity())
                    return;

                this.handleSubmit();
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