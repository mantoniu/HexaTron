import {Component} from "../component/component.js";
import {LeaderboardComponent} from "../leaderboard-component/leaderboard-component.js";
import {UserService} from "../../services/user-service.js";
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

        const result = await UserService.getInstance().getLeaderboard();
        this.leaderboard = result.playersELO;
        if (UserService.getInstance().isConnected())
            this.rank = result.rank;
        Object.keys(this.leaderboard).map(league => {
            const option = document.createElement("option");
            option.value = league;
            option.textContent = league;
            this.shadowRoot.getElementById("league-selector").appendChild(option);
        });
        const option = document.createElement("option");
        option.value = "Global";
        option.textContent = "Global";
        this.shadowRoot.getElementById("league-selector").appendChild(option);
        this.shadowRoot.getElementById("league-selector").value = "Global";
        this.selectLeague();
        this.addAutoCleanListener(this, "watchProfile", (event) => this.handleEvent(event));
    }

    selectLeague() {
        const league = this.shadowRoot.getElementById("league-selector").value;
        if (league === "Global") {
            this.shadowRoot.getElementById("leaderboard").setLeague(Object.values(this.leaderboard).flat());
        } else {
            this.shadowRoot.getElementById("leaderboard").setLeague(this.leaderboard[league]);
        }
    }

    handleEvent(event) {
        if (event.detail.player.name === UserService.getInstance().user.name) {
            const event = new CustomEvent("showUserProfile", {
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(event);
        } else {
            event.stopPropagation();
            this.shadowRoot.querySelector("user-profile").setAttribute("user", JSON.stringify(event.detail.player));
            this.shadowRoot.querySelector("user-profile").setAttribute("editable", false);
            this.shadowRoot.querySelector("user-profile").style.display = "block";
            this.shadowRoot.getElementById("leaderboard-container").style.display = "none";
        }
    }
}