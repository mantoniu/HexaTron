import {Component} from "../component/component.js";
import {RankDisplay} from "../rank-display/rank-display.js";
import {ImagePicker} from "../image-picker/image-picker.js";

export class ProfileHeader extends Component {
    constructor() {
        super();

        ImagePicker.register();
        RankDisplay.register();
    }

    static get observedAttributes() {
        return ["username", "league", "elo", "profile-picture"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._profilePictureElem = this.shadowRoot.querySelector("image-picker");
        this._rankDisplay = this.shadowRoot.getElementById("rank-display");
        this._usernameElem = this.shadowRoot.getElementById("username");

        this.addEventListener("imageUpdate", (e) => {
            if (this._profilePictureElem) {
                this._profilePictureElem.dispatchEvent(new CustomEvent("imageUpdate", {
                    detail: e.detail
                }));
            }
        });

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
            case "profile-picture":
                this._profilePicture = (newValue && newValue !== "null") ? newValue : null;
                break;
        }

        this._update();
    }

    _update() {
        if (this._profilePictureElem && this._profilePicture)
            this._profilePictureElem.setAttribute("image-src", this._profilePicture);

        if (this._usernameElem && this._username)
            this._usernameElem.innerText = this._username;

        if (this._rankDisplay && this._elo)
            this._rankDisplay.setAttribute("elo", String(Math.round(this._elo)));

        if (this._rankDisplay && this._league)
            this._rankDisplay.setAttribute("league", this._league);
    }
}