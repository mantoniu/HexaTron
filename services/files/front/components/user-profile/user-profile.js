import {AccountInformation} from "../account-information/account-information.js";
import {userService} from "../../services/user-service.js";
import {ProfileHeader} from "../profile-header/profile-header.js";
import {Component} from "../component/component.js";
import {createAlertMessage} from "../../js/utils.js";

export class UserProfile extends Component {
    constructor() {
        super();

        AccountInformation.register();
        ProfileHeader.register();
    }

    static get observedAttributes() {
        return ["user", "part"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.user = JSON.parse(this.getAttribute("user"));

        if (this.getAttribute("part")) {
            const elem = this.shadowRoot.querySelector(this.getAttribute("part"));

            if (!elem)
                return;

            elem.style.display = "flex";
            elem.user = this.user;
        }

        this._profileHeader = this.shadowRoot.querySelector("profile-header");
        this._updateProfileHeader();
        this._setupListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "user") {
            this.user = JSON.parse(newValue);
            this._updateProfileHeader();
        }
    }

    _setupListeners() {
        this.shadowRoot.addEventListener("updateInformation", async (event) => {
            const res = await userService.updateUser(event.detail);
            this._handleUpdateResponse(res);
        });

        this.shadowRoot.addEventListener("updatePassword", async (event) => {
            const data = event.detail;

            const res = await userService.updatePassword(
                data["current-password"],
                data["confirm-password"]);

            this._handlePasswordUpdate(res);
        });
    }

    _handleUpdateResponse(res) {
        if (res.success) {
            createAlertMessage(this.shadowRoot, "success", "Information successfully updated");
            this.user = userService.user;
            this._updateProfileHeader();
        } else
            createAlertMessage(this.shadowRoot, "error", res.error);
    }

    _handlePasswordUpdate(res) {
        if (res.success)
            createAlertMessage(this.shadowRoot, "success", "Password successfully updated");
        else
            createAlertMessage(this.shadowRoot, "error", res.error);
    }

    _updateProfileHeader() {
        if (!this._profileHeader)
            return;

        this._profileHeader.setAttribute("username", this.user.name);
        this._profileHeader.setAttribute("league", this.user.league);
        this._profileHeader.setAttribute("elo", this.user.elo);
        this._profileHeader.setAttribute("profilePicture", this.user.profilePicturePath);
    }
}