import {AccountInformation} from "../account-information/account-information.js";
import {userService} from "../../services/user-service.js";
import {ProfileHeader} from "../profile-header/profile-header.js";
import {Component} from "../component/component.js";
import {ModalDialog} from "../modal-dialog/modal-dialog.js";
import {AlertMessage} from "../alert-message/alert-message.js";

//TODO merge with main
export class UserProfile extends Component {
    constructor() {
        super();

        AccountInformation.register();
        ProfileHeader.register();
        ModalDialog.register();
        AlertMessage.register();
    }

    static get observedAttributes() {
        return ["user", "part"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._content = this.shadowRoot.getElementById("content");
        this._profileHeader = this.shadowRoot.querySelector("profile-header");
        let isOtherUser = false;

        if (this.hasAttribute("user")) {
            this.user = JSON.parse(this.getAttribute("user"));
            isOtherUser = true;
        } else
            this.user = userService.user;

        this._updateProfileHeader();
        this._loadContent(isOtherUser);
    }

    _loadContent(isOtherUser) {
        this._content.innerHTML = "";

        if (isOtherUser) {
            const friendPart = document.createElement("user-friend-part");
            friendPart.setAttribute("friend-id", this.user._id);
            this._content.appendChild(friendPart);
        } else {
            const accountInfo = document.createElement("account-information");
            accountInfo.user = this.user;
            this._content.appendChild(accountInfo);
            this._setupListeners(accountInfo);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "user") {
            this.user = JSON.parse(newValue);
            this._updateProfileHeader();
        }
    }

    _setupListeners(accountInfo) {
        this.shadowRoot.addEventListener("updateInformation", async (event) => {
            event.stopPropagation();
            const res = await userService.updateUser(event.detail);
            this._handleUpdateResponse(res);
        });

        this.shadowRoot.addEventListener("updatePassword", async (event) => {
            event.stopPropagation();
            const data = event.detail;

            const res = await userService.updatePassword(
                data["current-password"],
                data["confirm-password"]);

            this._handlePasswordUpdate(res);
        });

        this._setupAccountInformationListeners(accountInfo);
    }

    _setupAccountInformationListeners(accountInfo) {
        accountInfo.addEventListener("delete-user",
            () => this._createModalPopup());

        accountInfo.addEventListener("disconnect-user",
            () => this._handleLogout());
    }

    async _handleLogout() {
        await userService.logout();
        window.location.href = "/";
    }

    _createModalPopup() {
        const modalPopup = document.createElement("modal-dialog");

        modalPopup.setAttribute("modal-title", "⚠️ Delete your account ?");
        modalPopup.innerText = "Once you proceed with deletion, all your account information will be permanently removed. This includes your personal details, settings, and your Elo rating, which cannot be recovered. Please make sure you want to continue before confirming this action.";

        modalPopup.addEventListener("action", () => this._handleDelete());

        document.body.appendChild(modalPopup);
    }

    async _handleDelete() {
        const data = await userService.delete();
        if (data.success)
            window.location.href = "/";
        else
            this._createAlertMessageEvent("error", data.error);
    }

    _handleUpdateResponse(res) {
        if (res.success) {
            this._createAlertMessageEvent("success", "Information successfully updated");
            this.user = userService.user;
            this._updateProfileHeader();
        } else
            this._createAlertMessageEvent("error", res.error);
    }

    _handlePasswordUpdate(res) {
        if (res.success)
            this._createAlertMessageEvent("success", "Password successfully updated");
        else
            this._createAlertMessageEvent("error", res.error);
    }

    _createAlertMessageEvent(type, text) {
        this.dispatchEvent(new CustomEvent("createAlert", {
            bubbles: true,
            detail: {type, text}
        }));
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