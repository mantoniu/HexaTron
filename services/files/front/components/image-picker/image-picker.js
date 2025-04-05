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

    async connectedCallback() {
        await super.connectedCallback();

        this.container = this.shadowRoot.getElementById("profile-container");
        this.profilePicture = this.shadowRoot.querySelector('profile-picture');
        this.fileInput = this.shadowRoot.querySelector('#file-input');
        this.overlay = this.shadowRoot.querySelector('image-overlay');
        this._userId = this.getAttribute("user-id");

        const disabled = this.hasAttribute("disabled");
        if (disabled) {
            this.fileInput.disabled = true;
            if (this.overlay)
                this.overlay.style.display = "none";
        } else {
            this.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', this._handleFileSelect.bind(this));
        }

        this.addEventListener("imageUpdate", () =>
            this.profilePicture.dispatchEvent(new CustomEvent("imageUpdate")));

        this.profilePicture.addEventListener("imageLoaded",
            () => this._onImageLoad());

        this.profilePicture.addEventListener("imageError",
            () => this._onImageError());

        this._update();
    }

    _cropImageToSquare(file, targetSize = 512) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const size = Math.min(img.width, img.height);
                const offsetX = (img.width - size) / 2;
                const offsetY = (img.height - size) / 2;

                const canvas = document.createElement('canvas');
                canvas.width = targetSize;
                canvas.height = targetSize;
                const ctx = canvas.getContext('2d');

                ctx.drawImage(
                    img,
                    offsetX, offsetY, size, size,
                    0, 0, targetSize, targetSize
                );

                canvas.toBlob(blob => resolve(blob), file.type);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    async _handleFileSelect(event) {
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

        const croppedBlob = await this._cropImageToSquare(file);
        this.fileInput.disabled = true;
        this.container.classList.add("loading");
        this._loading = true;

        this.dispatchEvent(new CustomEvent('imageChanged', {
            bubbles: true,
            composed: true,
            detail: {file: croppedBlob}
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
        if (this.profilePicture && this._userId)
            this.profilePicture.setAttribute("user-id", this._userId);
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