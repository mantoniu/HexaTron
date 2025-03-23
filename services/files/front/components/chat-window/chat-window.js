import {ChatMessage} from "../chat-message/chat-message.js";
import {Component} from "../component/component.js";
import {UsernameBar} from "../username-bar/username-bar.js";

export class ChatWindow extends Component {
    constructor() {
        super();

        ChatMessage.register();
        UsernameBar.register();
        this._lastDate = null;
        this._currentUser = null;
    }

    initialize(messages, username, currentUser) {
        if (username)
            this._generateUserHeader(username);

        this._messagesDiv = this.shadowRoot.getElementById("messages");
        this._currentUser = currentUser;

        if (!messages.length)
            this._showNoMessagesText();
        else
            messages.forEach(message =>
                this.addMessage(message));
    }

    _generateUserHeader(username) {
        if (!username)
            return;

        const userHeader = document.createElement("username-bar");
        userHeader.setAttribute("username", username);
        this.shadowRoot.prepend(userHeader);
    }

    addMessage({_id, senderId, content, timestamp, isPending = false}) {
        this._dismissNoMessagesText();

        if (!this._messagesDiv)
            return;

        const date = new Date(timestamp);
        const dateString = date.toLocaleDateString();
        if (this._lastDate !== dateString) {
            this._addDateSeparator(dateString);
            this._lastDate = dateString;
        }

        const message = document.createElement("chat-message");

        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        const formattedTime = `${hours}:${minutes}`;

        message.setAttribute("id", _id);
        message.setAttribute("type", senderId === this._currentUser ? "sent" : "received");
        message.setAttribute("sender", senderId);
        message.setAttribute("timestamp", timestamp);
        message.setAttribute("time", formattedTime);
        message.setAttribute("content", content);

        if (isPending)
            message.setAttribute("pending", "");

        this._messagesDiv.appendChild(message);
        message.whenConnected.then(() => {
            this._scrollToBottom();
        });
    }

    deleteMessage(messageId) {
        const message = this.shadowRoot.getElementById(messageId);

        if (message)
            message.remove();

        if (!this._messagesDiv.querySelector("chat-message")) {
            const dateSeparator = this._messagesDiv.querySelector(".date-separator");
            if (dateSeparator)
                dateSeparator.remove();

            this._showNoMessagesText();
        }
    }

    refreshMessageStatus(tempId, defMessage) {
        const message = this.shadowRoot.getElementById(tempId);
        if (message)
            message.remove();

        this.addMessage(defMessage);
    }

    _scrollToBottom() {
        if (!this._messagesDiv)
            return;

        if (this._scrollTimeout)
            clearTimeout(this._scrollTimeout);

        this._scrollTimeout = setTimeout(() => {
            requestAnimationFrame(() =>
                this._messagesDiv.scrollTo({top: this._messagesDiv.scrollHeight, behavior: 'smooth'})
            );
        }, 100);
    }

    _addDateSeparator(date) {
        if (!this._messagesDiv)
            return;

        const separator = document.createElement("div");
        separator.classList.add("date-separator");
        separator.innerHTML = `<span>${date}</span>`;
        this._messagesDiv.appendChild(separator);
    }

    _showNoMessagesText() {
        if (!this._messagesDiv)
            return;

        const noMessagesText = document.createElement("div");
        noMessagesText.classList.add("no-messages");
        noMessagesText.textContent = "No messages yet. Be the first to send one!";

        this._messagesDiv.appendChild(noMessagesText);
    }

    _dismissNoMessagesText() {
        const noMessagesText = this._messagesDiv.querySelector(".no-messages");
        if (noMessagesText)
            noMessagesText.remove();
    }
}