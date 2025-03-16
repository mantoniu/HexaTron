import {Component} from "../component/component.js";

export class LeaderboardElement extends Component {
    constructor() {
        super();

        this.player = null;
    }

    setPlayer(player) {
        this.player = player;
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
            this.shadowRoot.getElementById("rank").textContent = this.rank;
            this.shadowRoot.getElementById("profile-picture").src = this.player.hasOwnProperty("profile-pictue") ? player["profile-pictue"] : "../../assets/profile.svg";
            this.shadowRoot.getElementById("name").textContent = this.player.name;
            this.shadowRoot.getElementById("elo").textContent = Math.round(this.player.elo);
        }
    }
}