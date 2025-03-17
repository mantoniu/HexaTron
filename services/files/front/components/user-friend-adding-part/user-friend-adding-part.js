import {Component} from "../component/component.js";

export class UserFriendAddingPart extends Component {

    constructor() {
        super();
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.addAutoCleanListener(this.shadowRoot.getElementById("addFriend"), "click", () => this.handleAddFriend());
    }


    async handleAddFriend() {
        //TODO Modification in the userService
        const event = new CustomEvent("updateFriendStatus", {
            detail: {player: this.player},
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
}
