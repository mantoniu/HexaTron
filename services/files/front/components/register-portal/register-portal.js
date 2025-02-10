import {SubmitButton} from "../submit-button/submit-button.js";
import {BaseAuth} from "../base-auth/base-auth.js";
import {UserService} from "../../services/user-service.js";
import {checkConfirmPassword} from "../../js/FormUtils.js";

export class RegisterPortal extends BaseAuth {
    constructor() {
        super();

        SubmitButton.register();
    }

    checkValidity() {
        const requiredValidity = super.checkValidity();

        const confirm = this.shadowRoot.getElementById("confirm-password");
        const passwordValue = this.getFormData["password"];
        const confirmPassword = this.getFormData["confirm-password"];

        return checkConfirmPassword(confirm, passwordValue, confirmPassword) && requiredValidity;
    }

    handleSubmit() {
        const data = this.getFormData();
        const name = data["username"];
        const password = data["password"];
        const answers = [
            data["security-question1"],
            data["security-question2"],
            data["security-question3"]
        ];

        UserService.getInstance().register({name, password, answers});
    }
}