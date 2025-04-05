import {Component} from "../component/component.js";

const defaultProfilePicture = "../../assets/profile.svg";
const profilePicturesPath = "/storage/profile-pictures/";

export class ProfilePicture extends Component {
    async connectedCallback() {
        await super.connectedCallback();

        this._img = this.shadowRoot.getElementById("profile-img");
        this._userId = this.getAttribute("user-id");

        this.addEventListener("imageUpdate", () => this._update());

        this._setDefaultProfilePicture();
        this._update();
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

            const imgWidth = this._img.clientWidth;
            const imgHeight = this._img.clientHeight;

            let imageSize = 'small';
            if (imgWidth >= 500 || imgHeight >= 500)
                imageSize = 'large';
            else if (imgWidth >= 100 || imgHeight >= 100)
                imageSize = 'medium';

            const cacheBuster = `?t=${Date.now()}`;
            this._img.src = "";

            setTimeout(() =>
                    this._img.src = `${profilePicturesPath}${this._userId}.jpg?size=${imageSize}&${cacheBuster}`
                , 10);
        }
    }
}