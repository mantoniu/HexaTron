import {Component} from "../component/component.js";

const defaultProfilePicture = "../../assets/profile.svg";
const profilePicturesPath = "/storage/profile-pictures/";

export class ProfilePicture extends Component {
    static get observedAttributes() {
        return ["user-id"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._img = this.shadowRoot.getElementById("profile-img");
        this.addEventListener("imageUpdate", () => this._update());
        this._setDefaultProfilePicture();

        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this._userId && name === "user-id" && newValue !== null) {
            this._userId = newValue;
            this._update();
        }
    }

    _setDefaultProfilePicture() {
        if (!this._img)
            return;

        this._img.src = defaultProfilePicture;
    }

    _update() {
        if (this._img && this._userId) {
            this._img.onload = () =>
                this.dispatchEvent(new CustomEvent("imageLoaded"));

            this._img.onerror = () => {
                this._setDefaultProfilePicture();
                this.dispatchEvent(new CustomEvent("imageError"));
            };

            const imgWidth = this.clientWidth;
            const imgHeight = this.clientHeight;

            let imageSize = 'small';
            if (imgWidth >= 300 || imgHeight >= 300)
                imageSize = 'large';
            else if (imgWidth >= 120 || imgHeight >= 120)
                imageSize = 'medium';

            const cacheBuster = `?t=${Date.now()}`;
            this._img.src = "";

            setTimeout(() =>
                    this._img.src = `${profilePicturesPath}${this._userId}.jpg?size=${imageSize}&${cacheBuster}`
                , 10);
        }
    }
}