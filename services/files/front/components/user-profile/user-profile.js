import {UserService} from "../../services/user-service.js";
import {FormInput} from "../form-input/form-input.js";
import {SubmitButton} from "../submit-button/submit-button.js";
import {ImageButton} from "../image-button/image-button.js";
import {BaseAuth} from "../base-auth/base-auth.js";
import {UserPasswordPart} from "../user-password-part/user-password-part.js";

export class UserProfile extends BaseAuth {
    static SELECTORS = {
        PROFILE_PICTURE: "profile-picture",
        USERNAME: "username",
        ELO: "elo",
        USERNAME_INPUT: "username-input",
        EDIT_USERNAME: "edit-username",
        USERNAME_DIV: "username-div",
    };

    constructor() {
        super();

        FormInput.register();
        SubmitButton.register();
        ImageButton.register();
        UserPasswordPart.register();

        this.editingUsername = false;
        this._elements = {};
    }

    static get observedAttributes() {
        return ["user", "editable", "part"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "user") {
            this.user = JSON.parse(newValue);
            this.updateUserData();
        }
        if (name === "editable" && !newValue) {
            this.shadowRoot.getElementById("edit-username").style.display = "none";
        }
    }

    async connectedCallback() {
        await super.connectedCallback();
        if (!JSON.parse(this.getAttribute("editable"))) {
            this.shadowRoot.getElementById("edit-username").style.display = "none";
        }
        this.user = JSON.parse(this.getAttribute("user"));
        if (this.getAttribute("part")) {
            this.shadowRoot.querySelector(this.getAttribute("part")).style.display = "flex";
        }
        this._elements = this.initializeElements(UserProfile.SELECTORS);
        this.setupEventListeners();
        this.updateUserData();

    }

    setupEventListeners() {
        this.addAutoCleanListener(this._elements.EDIT_USERNAME, "click", () => this.toggleUsernameEdit());
    }


    updateUserData() {
        if (!this.isConnected || !this.user)
            return;

        if (this._elements.PROFILE_PICTURE && this.user.profilePicturePath) {
            this._elements.PROFILE_PICTURE.src = this.user.profilePicturePath;
            this._elements.PROFILE_PICTURE.onerror = () => console.warn("Error loading the profile picture");
        }

        if (this._elements.USERNAME && this.user.name)
            this._elements.USERNAME.innerText = this.user.name;

        if (this._elements.ELO && this.user.elo) {
            this._elements.ELO.textContent += Math.round(this.user.elo);
        }
    }

    async toggleUsernameEdit() {
        if (!this.editingUsername) {
            this.showElement(this._elements.USERNAME_INPUT);
            this.hideElement(this._elements.USERNAME);
            this._elements.EDIT_USERNAME.setAttribute("src", "./assets/validate.svg");
            this._elements.USERNAME_INPUT.setAttribute("value", this.user.name);
            this.editingUsername = true;
        } else {
            if (this.checkInputs(UserProfile.SELECTORS.USERNAME_DIV)) {
                const newUsername = this._elements.USERNAME_INPUT.shadowRoot.querySelector("input").value;
                const data = await UserService.getInstance().updateUsername(newUsername);
                this._handleUsernameChange(data);
            }
        }
    }

    _handleUsernameChange(data) {
        if (data.success) {
            this.hideElement(this._elements.USERNAME_INPUT);
            this.showElement(this._elements.USERNAME);
            this._elements.EDIT_USERNAME.setAttribute("src", "./assets/edit.svg");
            this.editingUsername = false;
            if (this._elements.USERNAME && data.username)
                this._elements.USERNAME.innerText = data.username;
        } else alert(data.error);
    }
}