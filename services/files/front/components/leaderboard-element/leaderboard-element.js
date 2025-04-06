import {Component} from "../component/component.js";
import {PlayerDisplay} from "../player-display/player-display.js";

export class LeaderboardElement extends Component {
    constructor() {
        super();

        PlayerDisplay.register();
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
            const event = new CustomEvent("showUserProfile", {
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

            const playerDisplay = this.shadowRoot.querySelector("player-display");
            playerDisplay.setAttribute("user-id", this.player._id);
            playerDisplay.setAttribute("name", this.player.name);

            this.shadowRoot.getElementById("elo").textContent = Math.round(this.player.elo).toString();
        }
    }
}