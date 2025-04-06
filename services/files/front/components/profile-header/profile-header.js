import {Component} from "../component/component.js";
import {RankDisplay} from "../rank-display/rank-display.js";
import {ImagePicker} from "../image-picker/image-picker.js";
import {ProfilePicture} from "../profile-picture/profile-picture.js";

export class ProfileHeader extends Component {
    constructor() {
        super();

        ImagePicker.register();
        ProfilePicture.register();
        RankDisplay.register();
    }

    static get observedAttributes() {
        return ["username", "league", "elo", "other-user"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._profilePictureElem = this.shadowRoot.querySelector("image-picker");
        this._rankDisplay = this.shadowRoot.getElementById("rank-display");
        this._usernameElem = this.shadowRoot.getElementById("username");
        this._userId = this.getAttribute("user-id");

        this.addEventListener("imageUpdate", () =>
            this._updateProfilePicture());

        if (this._otherUser)
            this._profilePictureElem.setAttribute("disabled", "");

        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "username":
                this._username = newValue;
                break;
            case "league":
                this._league = newValue;
                break;
            case "elo":
                this._elo = parseFloat(newValue);
                break;
            case "other-user":
                this._otherUser = newValue === "true";
                break;
        }

        this._update();
    }

    _updateProfilePicture() {
        this._profilePictureElem.dispatchEvent(new CustomEvent("imageUpdate"));
    }

    _update() {
        if (this._profilePictureElem && this._userId) {
            if (this._profilePictureElem.hasAttribute("user-id"))
                this._updateProfilePicture();
            else
                this._profilePictureElem.setAttribute("user-id", this._userId);
        }

        if (this._usernameElem && this._username)
            this._usernameElem.innerText = this._username;

        if (this._rankDisplay && this._elo)
            this._rankDisplay.setAttribute("elo", String(Math.round(this._elo)));

        if (this._rankDisplay && this._league)
            this._rankDisplay.setAttribute("league", this._league);
    }
}