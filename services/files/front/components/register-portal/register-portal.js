import {SubmitButton} from "../submit-button/submit-button.js";
import {BaseAuth} from "../base-auth/base-auth.js";
import {userService} from "../../services/user-service.js";
import {DRAWER_CONTENT} from "../drawer-menu/drawer-menu.js";
import {createAlertMessage} from "../../js/utils.js";
import {FormInput} from "../form-input/form-input";

export class RegisterPortal extends BaseAuth {
    constructor() {
        super();

        SubmitButton.register();
        FormInput.register();
    }

    _registerHandler(data) {
        if (data.success) {
            this.dispatchEvent(new CustomEvent("changeContent", {
                bubbles: true,
                composed: true,
                detail: DRAWER_CONTENT.PROFILE,
            }));
        } else
            createAlertMessage(this.shadowRoot, "error", data.error);
    }

    async handleSubmit() {
        const data = this.getFormData();
        const name = data["username"];
        const password = data["password"];
        const answers = [
            data["security-question1"],
            data["security-question2"],
            data["security-question3"]
        ];

        const res = await userService.register({name, password, answers});
        this._registerHandler(res);
    }
}