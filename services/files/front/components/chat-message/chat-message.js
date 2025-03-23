import {Component} from "../component/component.js";

export class ChatMessage extends Component {
    constructor() {
        super();

        this._pending = false;
    }

    static get observedAttributes() {
        return ["type", "sender", "time", "content", "pending"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._usernameLabel = this.shadowRoot.getElementById("username");
        this._timeStampLabel = this.shadowRoot.getElementById("timestamp");
        this._messageContent = this.shadowRoot.getElementById("message-content");

        this.shadowRoot.getElementById("delete-btn").addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("message-deleted", {
                bubbles: true,
                composed: true,
                detail: {messageId: this.getAttribute("id")}
            }));
        });

        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "type":
                this._type = newValue;
                break;
            case "sender":
                this._sender = newValue;
                break;
            case "time":
                this._time = newValue;
                break;
            case "content":
                this._content = newValue;
                break;
            case "pending":
                this._pending = newValue !== null && newValue !== "false";
                break;
        }

        this._update();
    }

    _update() {
        if (!this._usernameLabel || !this._messageContent || !this._timeStampLabel)
            return;

        this._usernameLabel.innerHTML = this._sender;
        this._messageContent.innerHTML = this._content;
        this._timeStampLabel.innerHTML = this._time;

        this.className = '';
        this.classList.add(this._type);
        this.classList.toggle("pending", this._pending);
    }
}