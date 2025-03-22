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
            const event = new CustomEvent("watchProfile", {
                detail: {player: this.player},
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(event);
        });
    }

    initialise() {
        if (this.isConnected && this.player) {
            this.shadowRoot.querySelector("user-friend-part").setAttribute("friend-id", this.player._id);
            if (this.shadowRoot.getElementById("profile-picture"))
                this.shadowRoot.getElementById("profile-picture").src = this.player.hasOwnProperty("profile-pictue") ? player["profile-pictue"] : "../../assets/profile.svg";
            if (this.shadowRoot.getElementById("name"))
                this.shadowRoot.getElementById("name").textContent = this.player.name;
            if (this.shadowRoot.querySelector("user-friend-part")) {
                this.shadowRoot.querySelector("user-friend-part").setAttribute("deletion-desactivate", true);
                this.shadowRoot.querySelector("user-friend-part").setAttribute("short-version", true);
            }
        }
    }
}