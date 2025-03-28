import {Component} from "../component/component.js";

export class UserFriendPendingPart extends Component {
    static SELECTORS = {
        ACCEPT: "accept",
        REFUSE: "refuse"
    };

    constructor() {
        super();
        this._elements = {};
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._elements = this.initializeElements(UserFriendPendingPart.SELECTORS);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addAutoCleanListener(this._elements.ACCEPT, "click", (click) => this.handleAcceptFriend(click));
        this.addAutoCleanListener(this._elements.REFUSE, "click", (click) => this.handleRefuseFriend(click));
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
