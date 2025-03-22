import {Component} from "../component/component.js";

export class UserFriendAddingPart extends Component {

    constructor() {
        super();
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.addAutoCleanListener(this.shadowRoot.getElementById("addFriend"), "click", (click) => this.handleAddFriend(click));
    }

    async handleAddFriend(click) {
        click.stopPropagation();
        const event = new CustomEvent("addFriend", {
            detail: {player: this.player},
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
}
