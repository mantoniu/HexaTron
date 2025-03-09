import {Component} from "../component/component.js";
import {LeaderboardElement} from "../leaderboard-element/leaderboard-element.js";

export class LeaderboardComponent extends Component {
    constructor() {
        super();

        LeaderboardElement.register();

        this.leagueData = null;
    }

    setLeague(leagueData) {
        this.leagueData = leagueData;

        this.initialise();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.initialise();
    }

    initialise() {
        if (this.isConnected && this.leagueData) {
            if (!this.shadowRoot.getElementById("league-container")) {
                return;
            }
            this.shadowRoot.getElementById("league-container").innerHTML = "";
            this.leagueData.map((player, i) => {
                const element = document.createElement("leaderboard-element");
                element.setPlayer(player);
                element.id = i + 1;
                this.shadowRoot.getElementById("league-container").appendChild(element);
            });
        }
    }
}