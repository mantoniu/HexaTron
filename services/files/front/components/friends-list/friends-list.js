import {Component} from "../component/component.js";
import {FriendListElement} from "../friend-list-element/friend-list-element.js";

export class FriendsList extends Component {
    constructor() {
        super();

        FriendListElement.register();

        this.friendList = null;
        this.statusAccepted = [];
    }

    setFriendsList(friendList) {
        this.friendList = friendList;
        this.setupList();
    }

    addFriend(data) {
        this.friendList[data.id] = data.friendData;
        this.setupElement(data.id, data.friendData);
    }

    setStatusAccepted(status) {
        this.statusAccepted = status;
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupList();

        this.shadowRoot.getElementById("list-title").textContent = this.title;
    }

    setupList() {
        if (!this.isConnected || !this.friendList) {
            return;
        }
        if (Object.keys(this.friendList).length === 0) {
            const noMessagesText = document.createElement("p");
            noMessagesText.classList.add("no-messages");
            noMessagesText.textContent = this.getAttribute("message");

            this.shadowRoot.appendChild(noMessagesText);
        } else {
            Object.entries(this.friendList).forEach(([friendId, value]) => {
                this.setupElement(friendId, value);
            });
        }
    }

    setupElement(friendId, value) {
        const shadowRoot = this.shadowRoot;
        const element = shadowRoot.getElementById(friendId);
        if (this.statusAccepted.includes(value.status)) {
            if (!element) {
                const new_element = document.createElement("friend-list-element");
                new_element.id = friendId;
                new_element.setPlayer(value);
                new_element.setAttribute("activate-friend-part", true);
                shadowRoot.appendChild(new_element);
            } else {
                element.setPlayer(value);
            }
        } else if (element) {
            shadowRoot.removeChild(element);
        }
    }

    removeFromList(id) {
        if (this.shadowRoot.getElementById(id)) {
            this.shadowRoot.removeChild(this.shadowRoot.getElementById(id));
        }
    }
}