import {Component} from "../component/component.js";
import {chatService} from "../../services/chat-service.js";

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
        if (JSON.parse(this.getAttribute("deletion-desactivate"))) {
            this.style.marginTop = "0px";
            this._elements.DELETE_FRIEND.style.display = "none";
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addAutoCleanListener(this._elements.DELETE_FRIEND, "click", (click) => this.handleFriendDeletion(click));
        this.addAutoCleanListener(this._elements.MESSAGE, "click", (click) => this.sendMessage(click));
    }

    async handleFriendDeletion(click) {
        click.stopPropagation();
        const event = new CustomEvent("deleteFriend", {
            detail: {player: this.player},
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    sendMessage(click) {
        click.stopPropagation();
        chatService.createConversation(this.getAttribute("friendId"));
    }
}
