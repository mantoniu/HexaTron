import {Component} from "../component/component.js";
import {FriendMessage} from "../friend-message/friend-message.js";

export class FriendMessages extends Component {
    constructor() {
        super();

        this._userId = null;
        FriendMessage.register();
    }

    initialize(conversations, currUserId) {
        this._userId = currUserId;

        this._convDiv = this.shadowRoot.getElementById("conversations");

        if (!conversations.length)
            this._showNoConversationsText();

        conversations.forEach(conversation => {
                const friendName = conversation.participants[0];
                this.createFriendMessage(conversation._id, friendName, Array.from(conversation.messages.values()).at(-1));
            }
        );
    }

    createFriendMessage(conversationId, friendName, lastMessage) {
        if (!this._convDiv)
            return;

        const friendMessage = document.createElement("friend-message");

        friendMessage.setAttribute("id", conversationId);
        friendMessage.setAttribute("name", friendName);

        if (lastMessage) {
            friendMessage.setAttribute("time", this._formatTime(lastMessage.timestamp));
            friendMessage.setAttribute("message", lastMessage.content);

            if (lastMessage.senderId !== this._userId && !lastMessage.isRead)
                friendMessage.setAttribute("unread", "");
        }

        friendMessage.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("open-conversation", {
                detail: {conversationId},
                bubbles: true,
                composed: true
            }));
        });

        this._convDiv.appendChild(friendMessage);
    }

    updateFriendMessage(conversationId, lastMessage) {
        const friendMessage = this.shadowRoot.getElementById(conversationId);
        if (!friendMessage) return;

        if (lastMessage) {
            friendMessage.setAttribute("time", this._formatTime(lastMessage.timestamp));
            friendMessage.setAttribute("message", lastMessage.content);

            if (lastMessage.senderId !== this._userId && !lastMessage.isRead)
                friendMessage.setAttribute("unread", "");
            else
                friendMessage.removeAttribute("unread");
        } else {
            friendMessage.removeAttribute("time");
            friendMessage.removeAttribute("message");
            friendMessage.removeAttribute("unread");
        }

        this._convDiv.prepend(friendMessage);
        friendMessage.whenConnected.then(() =>
            this._scrollToTop()
        );
    }

    _scrollToTop() {
        if (!this._convDiv)
            return;

        if (this._scrollTimeout)
            clearTimeout(this._scrollTimeout);

        this._scrollTimeout = setTimeout(() => {
            requestAnimationFrame(() =>
                this._convDiv.scrollTo({top: 0, behavior: 'smooth'}));
        }, 100);
    }

    _formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();

        return isToday
            ? date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
            : date.toLocaleDateString();
    }

    _showNoConversationsText() {
        if (!this._convDiv)
            return;

        const noConversationsText = document.createElement("div");
        noConversationsText.classList.add("no-conversations");
        noConversationsText.textContent = "No conversations yet.";

        this._convDiv.appendChild(noConversationsText);
    }
}