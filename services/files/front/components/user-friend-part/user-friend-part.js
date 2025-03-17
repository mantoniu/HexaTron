import {Component} from "../component/component.js";
import {UserFriendRemovePart} from "../user-friend-remove-part/user-friend-remove-part.js";
import {UserFriendPendingPart} from "../user-friend-pending-part/user-friend-pending-part.js";
import {UserFriendAddingPart} from "../user-friend-adding-part/user-friend-adding-part.js";

export class UserFriendPart extends Component {

    constructor() {
        super();

        UserFriendRemovePart.register();
        UserFriendPendingPart.register();
        UserFriendAddingPart.register();

        this.addAutoCleanListener(this, "updateFriendStatus", () => this.update());
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
        this.update();
    }

    update() {
        if (this.shadowRoot.getElementById("add")) {
            this.shadowRoot.getElementById("add").style.display = "flex";
        }
    }
}
