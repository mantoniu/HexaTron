import {userService} from "../../services/user-service.js";
import {ListenerComponent} from "../component/listener-component.js";

export class FriendMessage extends ListenerComponent {
    constructor() {
        super();

        this._unread = false;
    }

    static get observedAttributes() {
        return ["name", "time", "unread", "message"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._nameElem = this.shadowRoot.getElementById("friend-name");
        this._lastMessageElem = this.shadowRoot.getElementById("friend-last-message");
        this._timeElem = this.shadowRoot.getElementById("friend-message-time");

        this._update();

        this.addAutomaticEventListener(userService, "updateFriends", () => {
            this._update();
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
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
        if (!this._nameElem || !this._lastMessageElem || !this._timeElem)
            return;

        this._lastMessageElem.innerHTML = this._lastMessage || "The conversation is empty.";

        if (this._name)
            this._nameElem.innerHTML = userService.getNameById(this._name);
        if (this._time)
            this._timeElem.innerHTML = this._time;

        if (this._unread)
            this.classList.add("unread");

        else this.className = '';
    }
}