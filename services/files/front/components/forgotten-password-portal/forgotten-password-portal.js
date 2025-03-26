import {BaseAuth} from "../base-auth/base-auth.js";
import {userService} from "../../services/user-service.js";
import {DRAWER_CONTENT} from "../drawer-menu/drawer-menu.js";
import {FormInput} from "../form-input/form-input.js";
import {SubmitButton} from "../submit-button/submit-button.js";

export class ForgottenPasswordPortal extends BaseAuth {
    constructor() {
        super();

        FormInput.register();
        SubmitButton.register();
    }

    _resetPasswordHandler(data) {
        if (data.success) {
            this.dispatchEvent(new CustomEvent("changeContent", {
                bubbles: true,
                composed: true,
                detail: DRAWER_CONTENT.PROFILE,
            }));
        } else
            this._createAlertMessageEvent("error", data.error);
    }

    _createAlertMessageEvent(type, text) {
        this.dispatchEvent(new CustomEvent("createAlert", {
            bubbles: true,
            detail: {type, text}
        }));
    }

    async handleSubmit() {
        const data = this.getFormData();
        const username = data["username"];
        const password = data["password"];
        const answers = [
            data["security-question1"],
            data["security-question2"],
            data["security-question3"]
        ];

        const res = await userService.resetPassword(username, password, answers);
        this._resetPasswordHandler(res);
    }
}