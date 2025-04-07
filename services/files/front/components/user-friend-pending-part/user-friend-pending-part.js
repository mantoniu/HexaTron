import {Component} from "../component/component.js";

export class UserFriendPendingPart extends Component {
    constructor() {
        super();
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupEventListeners();

        if (JSON.parse(this.getAttribute("icons-only")))
            this.shadowRoot.querySelectorAll("submit-button").forEach(button => button.style.display = "none");
        else
            this.shadowRoot.querySelectorAll("image-button").forEach(imageButton => imageButton.style.display = "none");
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll(".accept").forEach(element => {
            this.addAutoCleanListener(element, "click", (click) => this.handleAcceptFriend(click));
        });
        this.shadowRoot.querySelectorAll(".refuse").forEach(element => {
            this.addAutoCleanListener(element, "click", (click) => this.handleRefuseFriend(click));
        });
    }

    async handleAcceptFriend(click) {
        click.stopPropagation();
        const event = new CustomEvent("acceptFriend", {
            detail: {player: this.player},
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    async handleRefuseFriend(click) {
        click.stopPropagation();
        const event = new CustomEvent("refuseFriend", {
            detail: {player: this.player},
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }
}
