import {SubmitButton} from "../submit-button/submit-button.js";
import {userService} from "../../services/user-service.js";
import {BaseAuth} from "../base-auth/base-auth.js";
import {DRAWER_CONTENT} from "../drawer-menu/drawer-menu.js";
import {createAlertMessage} from "../../js/utils.js";

export class LoginPortal extends BaseAuth {
    constructor() {
        super();

        SubmitButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        const actionLinks = this.shadowRoot.querySelectorAll("[data-action]");
        actionLinks.forEach(link => {
            this.addAutoCleanListener(link, "click", (event) => this.handleActionClick(event));
        });
    }

    async handleSubmit() {
        const res = await userService.login(this.getFormData());
        this._loginHandler(res);
    }

    _loginHandler(data) {
        if (data.success) {
            this.dispatchEvent(new CustomEvent("changeContent", {
                bubbles: true,
                composed: true,
                detail: DRAWER_CONTENT.PROFILE,
            }));
        } else
            createAlertMessage(this.shadowRoot, "error", data.error);
    }

    handleActionClick(event) {
        const action = event.target.getAttribute("data-action");
        if (action) {
            this.dispatchEvent(new CustomEvent("changeContent", {
                bubbles: true,
                composed: true,
                detail: action,
            }));
        }
    }
}