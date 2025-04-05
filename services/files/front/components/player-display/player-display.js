import {Component} from "../component/component.js";
import {ProfilePicture} from "../profile-picture/profile-picture.js";

export class PlayerDisplay extends Component {
    constructor() {
        super();

        ProfilePicture.register();
    }

    static get observedAttributes() {
        return ["name"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._profilePictureElem = this.shadowRoot.querySelector("profile-picture");
        this.addEventListener("imageUpdate", () =>
            this._profilePictureElem.dispatchEvent(new CustomEvent("imageUpdate")));

        this._nameElem = this.shadowRoot.getElementById("name");
        this._userId = this.getAttribute("user-id");

        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "name":
                this._name = newValue;
                break;
        }

        this._update();
    }

    _update() {
        if (this._profilePictureElem && this._userId)
            this._profilePictureElem.setAttribute("user-id", this._userId);

        if (this._nameElem && this._name)
            this._nameElem.innerText = this._name;
    }
}