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
        this._list = this.shadowRoot.getElementById("list");

        this.setupList();
        this.shadowRoot.getElementById("list-title").textContent = this.title;
    }

    setupList() {
        if (!this.isConnected || !this.friendList)
            return;

        if (!this._list)
            this._list = this.shadowRoot.getElementById("list");

        const noMessages = this.shadowRoot.querySelector(".no-messages");
        const hasFriends = Object.values(this.friendList).some(friend =>
            this.statusAccepted.includes(friend.status)
        );

        if (!hasFriends && !noMessages) {
            const noMessagesText = document.createElement("p");
            noMessagesText.classList.add("no-messages");
            noMessagesText.textContent = this.getAttribute("message");
            this._list.appendChild(noMessagesText);
        } else if (hasFriends && noMessages)
            this._list.removeChild(noMessages);

        Object.entries(this.friendList).forEach(([friendId, value]) => {
            this.setupElement(friendId, value);
        });
    }

    setupElement(friendId, value) {
        if (!this._list)
            this._list = this.shadowRoot.getElementById("list");

        const element = this.shadowRoot.getElementById(friendId);
        if (this.statusAccepted.includes(value.status)) {
            if (!element) {
                const new_element = document.createElement("friend-list-element");
                new_element.id = friendId;
                new_element.setPlayer(value);
                new_element.setAttribute("activate-friend-part", "true");
                this._list.appendChild(new_element);
            } else {
                element.setPlayer(value);
            }
        } else if (element)
            this._list.removeChild(element);
    }

    removeFromList(id) {
        if (this.shadowRoot.getElementById(id))
            this.shadowRoot.removeChild(this.shadowRoot.getElementById(id));

        this.setupList();
    }
}