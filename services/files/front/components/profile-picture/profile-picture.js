import {Component} from "../component/component.js";

const defaultProfilePicture = "../../assets/profile.svg";
const profilePicturesPath = "/storage/profile-pictures/";

export class ProfilePicture extends Component {
    static get observedAttributes() {
        return ["src"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._img = this.shadowRoot.getElementById("profile-img");
        this._setDefaultProfilePicture();
        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "src")
            this._src = newValue;

        this._update();
    }

    _setDefaultProfilePicture() {
        if (!this._img)
            return;

        this._img.src = defaultProfilePicture;
    }

    _update() {
        if (this._img && this._src) {
            this._img.onload = () =>
                this.dispatchEvent(new CustomEvent("imageLoaded"));

            this._img.onerror = () => {
                this._setDefaultProfilePicture();
                this.dispatchEvent(new CustomEvent("imageError"));
            };

            const cacheBuster = `?t=${Date.now()}`;
            this._img.src = "";
            setTimeout(() =>
                    this._img.src = `${profilePicturesPath}${this._src}${cacheBuster}`
                , 10);
        }
    }
}