import {Component} from "../component/component.js";
import {CustomSpinner} from "../custom-spinner/custom-spinner.js";
import {ProfilePicture} from "../profile-picture/profile-picture.js";
import {ImageOverlay} from "../image-overlay/image-overlay.js";

export class ImagePicker extends Component {
    constructor() {
        super();

        CustomSpinner.register();
        ProfilePicture.register();
        ImageOverlay.register();

        this.options = {
            validTypes: ["image/jpeg", "image/png", "image/gif"],
            maxSize: 2 * 1024 * 1024
        };

        this._loading = false;
    }

    static get observedAttributes() {
        return ["image-src"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "image-src")
            this._imageSrc = newValue;

        this._update();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.container = this.shadowRoot.getElementById("profile-container");
        this.profilePicture = this.shadowRoot.querySelector('profile-picture');
        this.fileInput = this.shadowRoot.querySelector('#file-input');

        this.addEventListener('click', () => this.fileInput.click());
        this.profilePicture.style.cursor = 'pointer';
        this.fileInput.addEventListener('change', this._handleFileSelect.bind(this));

        this.addEventListener("imageUpdate", () => this._onImageLoad());

        this.profilePicture.addEventListener("imageLoaded",
            () => this._onImageLoad());

        this.profilePicture.addEventListener("imageError",
            () => this._onImageError());

        this._update();
    }

    _handleFileSelect(event) {
        if (this._loading)
            return;

        const file = event.target.files[0];

        if (!file)
            return;

        if (file.size > this.options.maxSize) {
            this._dispatchErrorEvent("File is too large. The maximum size is 2MB.");
            return;
        }

        if (!this.options.validTypes.includes(file.type)) {
            this._dispatchErrorEvent("Invalid file format. Please select a JPEG, PNG, or GIF image.");
            return;
        }

        this.fileInput.disabled = true;

        this.container.classList.add("loading");
        this._loading = true;

        this.dispatchEvent(new CustomEvent('imageChanged', {
            bubbles: true,
            composed: true,
            detail: {file: file}
        }));
    }

    _dispatchErrorEvent(error) {
        this.dispatchEvent(new CustomEvent("uploadError", {
            bubbles: true,
            composed: true,
            detail: {text: error}
        }));
    }

    _update() {
        if (this.profilePicture && this._imageSrc)
            this.profilePicture.setAttribute("src", this._imageSrc);
    }

    _onImageLoad() {
        if (!this.container)
            return;

        this.container.classList.remove("loading");
        this._loading = false;
        this.fileInput.disabled = false;
    }

    _onImageError() {
        if (!this.container || !this.profilePicture)
            return;

        this.container.classList.remove("loading");
        this._loading = false;
        this.fileInput.disabled = false;
    }
}