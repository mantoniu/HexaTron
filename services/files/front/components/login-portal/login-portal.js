import {SubmitButton} from "../submit-button/submit-button.js";
import {UserService} from "../../services/user-service.js";
import {BaseAuth} from "../base-auth/base-auth.js";

export class LoginPortal extends BaseAuth {
    constructor() {
        super();

        SubmitButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();


        this._loginHandler = (data) => {
            if (data.success) {
                this.dispatchEvent(new CustomEvent("changeContent", {
                    bubbles: true,
                    composed: true,
                    detail: "profile",
                }));
            } else alert(data.error);
        };

        UserService.getInstance().on("login", this._loginHandler);
        const actionLinks = this.shadowRoot.querySelectorAll("[data-action]");
        actionLinks.forEach(link => {
            this.addAutoCleanListener(link, "click", (event) => this.handleActionClick(event));
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        UserService.getInstance().off("login", this._loginHandler);
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

    handleSubmit() {
        UserService.getInstance().login(this.getFormData());
    }
}