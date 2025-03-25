import {userService} from "../../services/user-service.js";
import {SubmitButton} from "../submit-button/submit-button.js";
import {PasswordUpdate} from "../password-update/password-update.js";
import {InformationUpdate} from "../information-update/information-update.js";
import {Component} from "../component/component.js";

export class AccountInformation extends Component {
    constructor() {
        super();

        SubmitButton.register();
        PasswordUpdate.register();
        InformationUpdate.register();
        this._elements = {};
    }

    set user(user) {
        this._user = user;
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._deleteButton = this.shadowRoot.getElementById("delete");
        this._logoutButton = this.shadowRoot.getElementById("logout");
        this.setupEventListeners();

        this.shadowRoot.querySelector("information-update").user = this._user;
    }

    setupEventListeners() {
        this.addAutoCleanListener(this._deleteButton, "click", () => this.handleDeletion());
        this.addAutoCleanListener(this._logoutButton, "click", () => this.handleLogout());
    }

    async handleLogout() {
        await userService.logout();
        window.location.href = "/";
    }

    async handleDeletion() {
        const data = await userService.delete();
        if (data.success) {
            //TODO add a message directly in the div
            alert(data.message);
            window.location.href = "/";
        } else alert(data.error);
    }
}
