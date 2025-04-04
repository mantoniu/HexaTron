import {Component} from "../component/component.js";
import {LeaderboardComponent} from "../leaderboard-component/leaderboard-component.js";
import {userService} from "../../services/user-service.js";
import {UserProfile} from "../user-profile/user-profile.js";
import {LEAGUE_ICONS, LEAGUES} from "../../js/utils.js";

export class LeaderboardPortal extends Component {
    constructor() {
        super();

        LeaderboardComponent.register();
        UserProfile.register();

        this.leaderboard = [];
    }

    async connectedCallback() {
        await super.connectedCallback();

        const shadowRoot = this.shadowRoot;
        const leagueSelector = shadowRoot.getElementById("league-selector");
        leagueSelector.addEventListener("input", () => this.selectLeague());

        const result = await userService.getLeaderboard();

        this.leaderboard = result.playersELO;

        if (userService.isConnected()) {
            this.rank = result.rank;
        }

        Object.keys(LEAGUES).map(league => {
            const option = document.createElement("option");
            option.value = LEAGUES[league];
            option.textContent = LEAGUES[league];
            leagueSelector.appendChild(option);
        });

        leagueSelector.value = LEAGUES.GLOBAL;
        this.shadowRoot.getElementById("league-icon").src = LEAGUE_ICONS.Global;
        this.selectLeague();
    }

    selectLeague() {
        const league = this.shadowRoot.getElementById("league-selector").value;
        this.shadowRoot.getElementById("league-icon").src = LEAGUE_ICONS[league];
        this.shadowRoot.getElementById("leaderboard").setLeague(league, this.leaderboard[league], this.rank);
    }
}