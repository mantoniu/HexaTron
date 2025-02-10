import {BaseAuth} from "../base-auth/base-auth.js";
import {UserService} from "../../services/user-service.js";

export class ForgottenPasswordPortal extends BaseAuth {
    handleSubmit() {
        UserService.getInstance().resetPassword(this.getFormData());
    }
}