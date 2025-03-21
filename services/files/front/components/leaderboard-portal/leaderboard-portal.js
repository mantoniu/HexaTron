import {Component} from "../component/component.js";
import {LeaderboardComponent} from "../leaderboard-component/leaderboard-component.js";
import {userService} from "../../services/user-service.js";
import {UserProfile} from "../user-profile/user-profile.js";

export class LeaderboardPortal extends Component {
    constructor() {
        super();

        LeaderboardComponent.register();
        UserProfile.register();

        this.leaderboard = [];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.shadowRoot.getElementById("league-selector").addEventListener("input", () => this.selectLeague());

        const result = await userService.getLeaderboard();

        this.leaderboard = result.playersELO;

        if (userService.isConnected()) {
            this.rank = result.rank;
        }

        Object.keys(this.leaderboard).map(league => {
            const option = document.createElement("option");
            option.value = league;
            option.textContent = league;
            this.shadowRoot.getElementById("league-selector").appendChild(option);
        });

        this.shadowRoot.getElementById("league-selector").value = "Global";
        this.selectLeague();
        this.addAutoCleanListener(this, "watchProfile", (event) => this.handleEvent(event));
    }

    selectLeague() {
        const league = this.shadowRoot.getElementById("league-selector").value;
        this.shadowRoot.getElementById("leaderboard").setLeague(league, this.leaderboard[league], this.rank);
    }

    handleEvent(event) {
        event.stopPropagation();
        const newEvent = new CustomEvent("showUserProfile", {
            bubbles: true,
            composed: true,
            detail: event.detail.player
        });
        this.dispatchEvent(newEvent);
    }
}