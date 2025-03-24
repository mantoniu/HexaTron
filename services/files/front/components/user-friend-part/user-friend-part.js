import {Component} from "../component/component.js";
import {UserFriendRemovePart} from "../user-friend-remove-part/user-friend-remove-part.js";
import {UserFriendPendingPart} from "../user-friend-pending-part/user-friend-pending-part.js";
import {UserFriendAddingPart} from "../user-friend-adding-part/user-friend-adding-part.js";
import {userService} from "../../services/user-service.js";
import {UserFriendRequestedPart} from "../user-friend-requested-part/user-friend-requested-part.js";

export class UserFriendPart extends Component {
    static EVENTS = {
        ACCEPT: "acceptFriend",
        DELETE_FRIEND: "deleteFriend",
        ADD_FRIEND: "addFriend",
        REFUSE: "refuseFriend"
    };

    static SELECTORS = {
        REQUESTED: "requested",
        PENDING: "pending",
        FRIEND: "friend",
        ADD: "add"
    };

    constructor() {
        super();

        UserFriendRemovePart.register();
        UserFriendPendingPart.register();
        UserFriendRequestedPart.register();
        UserFriendAddingPart.register();

        Object.values(UserFriendPart.EVENTS).map(value => this.addAutoCleanListener(this, value, (event) => this.handleEvents(event, value)));
        this._elements = {};
        this._friendId = null;
    }

    static get observedAttributes() {
        return ["friend-id"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this._friendId = newValue;
        this.update();
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._elements = this.initializeElements(UserFriendPart.SELECTORS);
        this.update();
        this._elements.REQUESTED.setAttribute("short-version", this.getAttribute("short-version"));
        this._elements.FRIEND.setAttribute("deletion-desactivate", this.getAttribute("deletion-desactivate"));
        this._elements.FRIEND.setAttribute("friendId", this._friendId);
    }

    update() {
        [...this.shadowRoot.children].forEach(child => child.style.display = "none");

        switch (userService.user.friends[this._friendId]?.status) {
            case "requested":
                if (this._elements.REQUESTED) {
                    this._elements.REQUESTED.style.display = "flex";
                }
                break;
            case "pending":
                if (this._elements.PENDING) {
                    this._elements.PENDING.style.display = "flex";
                }
                break;
            case "friends":
                if (this._elements.FRIEND) {
                    this._elements.FRIEND.style.display = "flex";
                }
                break;
            default:
                if (this._elements.ADD) {
                    this._elements.ADD.style.display = "flex";
                }
        }
    }

    handleEvents(event, eventType) {
        event.stopPropagation();
        switch (eventType) {
            case UserFriendPart.EVENTS.ADD_FRIEND:
                userService.addFriend(this._friendId).then(() => {
                    this.update();
                });
                break;
            case UserFriendPart.EVENTS.ACCEPT:
                userService.acceptFriend(this._friendId).then(() => {
                    this.update();
                });
                break;
            case UserFriendPart.EVENTS.REFUSE:
                userService.removeFriend(this._friendId).then(() => {
                    this.update();
                });
                break;
            case UserFriendPart.EVENTS.DELETE_FRIEND:
                userService.removeFriend(this._friendId).then(() => {
                    this.update();
                });
                break;
        }
    }
}
