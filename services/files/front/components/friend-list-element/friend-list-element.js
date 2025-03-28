import {Component} from "../component/component.js";
import {UserFriendPart} from "../user-friend-part/user-friend-part.js";

export class FriendListElement extends Component {
    constructor() {
        super();

        UserFriendPart.register();
        FriendListElement.register();

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
        const profilePicture = shadowRoot.getElementById("profile-picture");
        const playerName = shadowRoot.getElementById("name");
        if (userFriendPart) {
            userFriendPart.setAttribute("friend-id", this.player._id);

            if (this.hasAttribute("activate-friend-part")) {
                userFriendPart.setAttribute("deletion-desactivate", "true");
                userFriendPart.setAttribute("short-version", "true");
            } else {
                userFriendPart.style.display = "none";
            }
        }
        if (profilePicture) {
            profilePicture.src = this.player.hasOwnProperty("profile-picture")
                ? this.player["profile-picture"]
                : "../../assets/profile.svg";
        }
        if (playerName) {
            playerName.textContent = this.player.name;
        }
    }
}