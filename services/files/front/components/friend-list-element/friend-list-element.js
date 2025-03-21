import {Component} from "../component/component.js";

export class FriendListElement extends Component {
    constructor() {
        super();

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
            if (this.shadowRoot.getElementById("profile-picture"))
                this.shadowRoot.getElementById("profile-picture").src = this.player.hasOwnProperty("profile-pictue") ? player["profile-pictue"] : "../../assets/profile.svg";
            if (this.shadowRoot.getElementById("name"))
                this.shadowRoot.getElementById("name").textContent = this.player.name;
        }
    }
}