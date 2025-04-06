import {Component} from "../component/component.js";
import {chatService} from "../../services/chat-service.js";

export class UserFriendRemovePart extends Component {
    static SELECTORS = {
        MESSAGE: "sendMessage",
        DELETE_FRIEND: "deleteFriend",
        CHALLENGE: "challenge"
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

        this._friendId = this.getAttribute("friendId");

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addAutoCleanListener(this._elements.CHALLENGE, "click", () => this._launchFriendlyGame());
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
        chatService.createConversation(this._friendId);
    }

    _launchFriendlyGame() {
        this.dispatchEvent(new CustomEvent("closeDrawer", {
            composed: true,
            bubbles: true
        }));

        window.dispatchEvent(new CustomEvent("navigate", {
            detail: {
                route: `/friendly`,
                params: {friendId: this._friendId}
            }
        }));
    }
}
