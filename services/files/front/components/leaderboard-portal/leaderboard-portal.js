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
        if (event.detail.player.name === userService.user.name) {
            const newEvent = new CustomEvent("showUserProfile", {
                bubbles: true,
                composed: true
            });
            this.dispatchEvent(newEvent);
        } else {
            const userProfile = document.createElement("user-profile");

            userProfile.setAttribute("user", JSON.stringify(event.detail.player));
            userProfile.setAttribute("editable", false);
            userProfile.setAttribute("part", "user-friend-part");

            userProfile.style.display = "block";

            this.shadowRoot.getElementById("leaderboard-container").style.display = "none";
            this.shadowRoot.appendChild(userProfile);
        }
    }
}