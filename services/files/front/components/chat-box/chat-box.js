import {Component} from "../component/component.js";
import {ChatInput} from "../chat-input/chat-input.js";
import {ChatWindow} from "../chat-window/chat-window.js";

export class ChatBox extends Component {
    constructor() {
        super();

        ChatWindow.register();
        ChatInput.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._chatWindow = this.shadowRoot.querySelector("chat-window");

        this.shadowRoot.querySelector("chat-input").addEventListener("new-message", (event) => {
            this.dispatchEvent(new CustomEvent("new-message", {
                detail: {conversationId: this.getAttribute("id"), message: event.detail.message},
            }));
        });

        this.shadowRoot.addEventListener("message-deleted", (event) => {
            this.dispatchEvent(new CustomEvent("delete-message", {
                detail: {conversationId: this.getAttribute("id"), messageId: event.detail.messageId}
            }));
        });
    }

    initialize(messages, friendUsername, currentUser) {
        if (!this._chatWindow)
            this._chatWindow = this.shadowRoot.querySelector("chat-window");

        if (this._chatWindow?.whenConnected) {
            this._chatWindow.whenConnected.then(() => {
                this._chatWindow.initialize(messages, friendUsername, currentUser);
            });
        } else
            console.warn("Chat window not available at initialisation");
    }

    messageAdded(conversationId, message) {
        this._chatWindow?.addMessage(message);
    }

    messageSent(tempId, defMessage) {
        this._chatWindow?.refreshMessageStatus(tempId, defMessage);
    }

    messageDeleted(conversationId, messageId) {
        this._chatWindow?.deleteMessage(messageId);
    }

    refresh(messages) {
        this._chatWindow.refresh(messages);
    }
}