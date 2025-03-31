import {BaseAuth} from "../base-auth/base-auth.js";
import {SectionTitle} from "../section-title/section-title.js";
import {FormInput} from "../form-input/form-input.js";
import {SubmitButton} from "../submit-button/submit-button.js";

export class InformationUpdate extends BaseAuth {
    constructor() {
        super();

        SectionTitle.register();
        FormInput.register();
        SubmitButton.register();
        this._user = null;
    }

    set user(user) {
        this._user = user;
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.shadowRoot.getElementById("name")
            .setAttribute("value", this._user.name);
    }

    handleSubmit() {
        this.dispatchEvent(new CustomEvent("updateInformation", {
            composed: true,
            bubbles: true,
            detail: this.getFormData()
        }));
    }
}