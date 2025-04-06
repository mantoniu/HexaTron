import {Component} from "../component/component.js";
import {ProfilePicture} from "../profile-picture/profile-picture.js";

export class FriendMessage extends Component {
    constructor() {
        super();

        ProfilePicture.register();
        this._unread = false;
    }

    static get observedAttributes() {
        return ["name", "friend-id", "time", "unread", "message"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._nameElem = this.shadowRoot.getElementById("friend-name");
        this._lastMessageElem = this.shadowRoot.getElementById("friend-last-message");
        this._timeElem = this.shadowRoot.getElementById("friend-message-time");
        this._profilePicture = this.shadowRoot.querySelector("profile-picture");

        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "friend-id":
                this._friendId = newValue;
                break;
            case "name":
                this._name = newValue;
                break;
            case "time":
                this._time = newValue;
                break;
            case "unread":
                this._unread = newValue != null;
                break;
            case "message":
                this._lastMessage = newValue;
                break;
        }

        this._update();
    }

    _update() {
        if (!this._nameElem || !this._lastMessageElem || !this._timeElem || !this._profilePicture)
            return;

        this._lastMessageElem.textContent = this._lastMessage || "The conversation is empty.";

        if (this._friendId) {
            if (this._profilePicture.hasAttribute("user-id"))
                this._profilePicture.dispatchEvent(new CustomEvent("imageUpdate"));
            else this._profilePicture.setAttribute("user-id", this._friendId);
        }
        if (this._name)
            this._nameElem.textContent = this._name;
        if (this._time)
            this._timeElem.textContent = this._time;

        if (this._unread)
            this.classList.add("unread");

        else this.className = '';
    }
}