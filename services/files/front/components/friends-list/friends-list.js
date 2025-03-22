import {Component} from "../component/component.js";
import {FriendListElement} from "../friend-list-element/friend-list-element.js";

export class FriendsList extends Component {
    constructor() {
        super();

        FriendListElement.register();

        this.friendList = null;
        this.statusAccepted = [];
        this.currentElements = {};
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
        if (this.isConnected && this.friendList) {
            Object.entries(this.friendList).forEach(([friendId, value]) => {
                this.setupElement(friendId, value);
            });
        }
    }

    setupElement(friendId, value) {
        if (this.statusAccepted.includes(value.status)) {
            if (!this.shadowRoot.getElementById(friendId)) {
                const element = document.createElement("friend-list-element");
                element.id = friendId;
                element.setPlayer(value);
                this.shadowRoot.appendChild(element);
                this.currentElements[friendId] = element;
            } else {
                this.shadowRoot.getElementById(friendId).setPlayer(value);
            }
        } else if (this.shadowRoot.getElementById(friendId)) {
            this.shadowRoot.removeChild(this.shadowRoot.getElementById(friendId));
        }
    }

    removeFromList(id) {
        if (this.shadowRoot.getElementById(id)) {
            this.shadowRoot.removeChild(this.shadowRoot.getElementById(id));
        }
    }
}