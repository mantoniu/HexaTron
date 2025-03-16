import {UserService} from "../../services/user-service.js";
import {FormInput} from "../form-input/form-input.js";
import {SubmitButton} from "../submit-button/submit-button.js";
import {ImageButton} from "../image-button/image-button.js";
import {BaseAuth} from "../base-auth/base-auth.js";
import {getInputsData} from "../../js/FormUtils.js";

export class UserPasswordPart extends BaseAuth {
    static SELECTORS = {
        PASSWORD_DIV: "password-div",
        PASSWORD_INPUTS_DIV: "password-inputs",
        PASSWORD: "password-display",
        EDIT_PASSWORD: "edit-password",
        CURRENT_PASSWORD_INPUT: "current-password",
        NEW_PASSWORD_INPUT: "password",
        CONFIRM_PASSWORD_INPUT: "confirm-password",
        LOGOUT: "logout",
        DELETE: "delete"
    };

    constructor() {
        super();

        FormInput.register();
        SubmitButton.register();
        ImageButton.register();

        this.editingPassword = false;
        this._elements = {};
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._elements = this.initializeElements(UserPasswordPart.SELECTORS);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addAutoCleanListener(this._elements.EDIT_PASSWORD, "click", () => this.togglePasswordEdit());
        this.addAutoCleanListener(this._elements.DELETE, "click", () => this.handleDeletion());
        this.addAutoCleanListener(this._elements.LOGOUT, "click", () => this.handleLogout());
    }

    async handleLogout() {
        await UserService.getInstance().logout();
        window.location.href = "/";
    }

    async handleDeletion() {
        const data = await UserService.getInstance().delete();
        if (data.success) {
            alert(data.message);
            window.location.href = "/";
        } else alert(data.error);
    }

    async togglePasswordEdit() {
        if (!this.editingPassword) {
            this.showElement(this._elements.PASSWORD_INPUTS_DIV);
            this.hideElement(this._elements.PASSWORD);
            this._elements.PASSWORD_DIV.classList.replace("inline", "password-edit");
            this._elements.EDIT_PASSWORD.setAttribute("src", "./assets/validate.svg");
            this.editingPassword = true;
        } else {
            if (this.checkInputs(UserPasswordPart.SELECTORS.PASSWORD_DIV)) {
                const inputs = this.getInputs(`#${UserPasswordPart.SELECTORS.PASSWORD_DIV} form-input`);
                const inputsData = getInputsData(inputs);
                const data = await UserService.getInstance().updatePassword(
                    inputsData["current-password"],
                    inputsData["confirm-password"]
                );
                this._handlePasswordChange(data, inputs);
            }
        }
    }

    _handlePasswordChange(data, inputs) {
        if (data.success) {
            inputs.forEach(formInput => formInput.shadowRoot.querySelector("input").value = "");
            this.hideElement(this._elements.PASSWORD_INPUTS_DIV);
            this.showElement(this._elements.PASSWORD);
            this._elements.PASSWORD_DIV.classList.replace("password-edit", "inline");
            this._elements.EDIT_PASSWORD.setAttribute("src", "./assets/edit.svg");
            this.editingPassword = false;
            alert(data.message);
        } else alert(data.error);
    }
}
