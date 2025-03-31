import {BaseAuth} from "../base-auth/base-auth.js";
import {SectionTitle} from "../section-title/section-title.js";
import {FormInput} from "../form-input/form-input.js";
import {SubmitButton} from "../submit-button/submit-button.js";

export class PasswordUpdate extends BaseAuth {
    constructor() {
        super();

        SectionTitle.register();
        FormInput.register();
        SubmitButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._inputs = this.shadowRoot.querySelectorAll("form-input");
    }

    handleSubmit() {
        this.dispatchEvent(new CustomEvent("updatePassword", {
            composed: true,
            bubbles: true,
            detail: this.getFormData()
        }));

        this._emptyInputs();
    }

    _emptyInputs() {
        this._inputs.forEach(formInput =>
            formInput.shadowRoot.querySelector("input").value = "");
    }
}