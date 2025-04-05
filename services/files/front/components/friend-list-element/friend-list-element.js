import {Component} from "../component/component.js";
import {UserFriendPart} from "../user-friend-part/user-friend-part.js";
import {PlayerDisplay} from "../player-display/player-display.js";

export class FriendListElement extends Component {
    constructor() {
        super();

        UserFriendPart.register();
        FriendListElement.register();
        PlayerDisplay.register();

        this.player = null;
    }

    setPlayer(player) {
        this.player = player;
        this.player._id = this.id;
        this.initialise();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.initialise();
        this.addEventListener("click", () => {
            const event = new CustomEvent("showUserProfile", {
                detail: {player: this.player, element: this},
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(event);
        });
    }

    initialise() {
        if (!this.isConnected || !this.player)
            return;

        const shadowRoot = this.shadowRoot;
        const userFriendPart = shadowRoot.querySelector("user-friend-part");
        const userDisplay = shadowRoot.querySelector("player-display");

        if (userFriendPart) {
            userFriendPart.setAttribute("friend-id", this.player._id);

            if (this.hasAttribute("activate-friend-part")) {
                userFriendPart.setAttribute("deletion-desactivate", "true");
                userFriendPart.setAttribute("short-version", "true");
            } else {
                userFriendPart.style.display = "none";
            }
        }

        if (userDisplay) {
            userDisplay.setAttribute("name", this.player.name);

            if (userDisplay.hasAttribute("user-id")) {
                userDisplay.dispatchEvent(new CustomEvent("imageUpdate"));
            } else userDisplay.setAttribute("user-id", this.player._id);
        }
    }
}