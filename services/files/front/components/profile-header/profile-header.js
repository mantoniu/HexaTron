import {Component} from "../component/component.js";
import {RankDisplay} from "../rank-display/rank-display.js";

export class ProfileHeader extends Component {
    constructor() {
        super();

        RankDisplay.register();
    }

    static get observedAttributes() {
        return ["username", "league", "elo", "profilePicture"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._profilePictureElem = this.shadowRoot.getElementById("profile-picture");
        this._rankDisplay = this.shadowRoot.getElementById("rank-display");
        this._usernameElem = this.shadowRoot.getElementById("username");

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
            case "profilePicture":
                this._profilePicture = newValue;
                break;
        }

        this._update();
    }

    _update() {
        if (this._profilePictureElem && this._profilePicture) {
            this._profilePictureElem.src = this._profilePicture;
            this._profilePictureElem.onerror = () => console.warn("Error loading the profile picture");
        }

        if (this._usernameElem && this._username)
            this._usernameElem.innerText = this._username;

        if (this._rankDisplay && this._elo)
            this._rankDisplay.setAttribute("elo", String(Math.round(this._elo)));

        if (this._rankDisplay && this._league)
            this._rankDisplay.setAttribute("league", this._league);
    }
}