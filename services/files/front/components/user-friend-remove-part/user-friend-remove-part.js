import {Component} from "../component/component.js";

export class UserFriendRemovePart extends Component {
    static SELECTORS = {
        MESSAGE: "sendMessage",
        DELETE_FRIEND: "deleteFriend"
    };

    constructor() {
        super();
        this._elements = {};
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._elements = this.initializeElements(UserFriendRemovePart.SELECTORS);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addAutoCleanListener(this._elements.DELETE_FRIEND, "click", () => this.handleFriendDeletion());
        this.addAutoCleanListener(this._elements.DELETE_FRIEND, "click", () => this.sendMessage());
    }

    async handleFriendDeletion() {
        //TODO deletion in the userService
        const event = new CustomEvent("updateFriendStatus", {
            detail: {player: this.player},
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    sendMessage() {
        //TODO go to the message page
    }
}
