import {Component} from "../component/component.js";
import {chatService} from "../../services/chat-service.js";
import {SubmitButton} from "../submit-button/submit-button.js";

export class UserFriendRemovePart extends Component {
    static SELECTORS = {
        MESSAGE: "sendMessage",
        DELETE_FRIEND: "deleteFriend",
        CHALLENGE: "challenge"
    };

    constructor() {
        super();

        SubmitButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        if (JSON.parse(this.getAttribute("deletion-desactivate"))) {
            this.style.marginTop = "0px";
            this.shadowRoot.getElementById("deleteFriend").style.display = "none";
        }

        this._friendId = this.getAttribute("friendId");

        if (JSON.parse(this.getAttribute("icons-only"))) {
            this.shadowRoot.querySelectorAll("submit-button").forEach(button => button.style.display = "none");
            this.style.flexDirection = "row";
        } else
            this.shadowRoot.querySelectorAll(".iconButton").forEach(button => button.style.display = "none");
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll(".sendMessage").forEach(element => {
            this.addAutoCleanListener(element, "click", (click) => this.sendMessage(click));
        });
        this.shadowRoot.querySelectorAll(".challenge").forEach(element => {
            this.addAutoCleanListener(element, "click", (click) => {
                this._launchFriendlyGame()
            });
        });
        this.addAutoCleanListener(this.shadowRoot.getElementById("deleteFriend"), "click", (click) => this.handleFriendDeletion(click));
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
