import {Component} from "../component/component.js";
import {LeaderboardElement} from "../leaderboard-element/leaderboard-element.js";
import {UserService} from "../../services/user-service.js";

const SCROLL_DIRECTION = Object.freeze({
    UP: "up",
    DOWN: "down"
});

export class LeaderboardComponent extends Component {

    constructor() {
        super();

        LeaderboardElement.register();

        this.leagueData = null;
        this.league = "";
        this.lastScrollTop = 0;
        this.scrollDirection = null;
        this.observer = null;
    }

    setLeague(leagueName, leagueData, rank) {
        this.leagueData = leagueData;
        this.league = leagueName;
        this.rank = rank;

        if (this.observer) {
            this.observer.disconnect();
        }

        this.initialise();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.initialise();
        this.addAutoCleanListener(this.shadowRoot.getElementById("league-container"), "scroll", this.detectScrollDirection.bind(this));
    }

    initialise() {
        if (this.isConnected && this.leagueData) {
            if (!this.shadowRoot.getElementById("league-container")) {
                return;
            }
            this.shadowRoot.getElementById("league-container").innerHTML = "";

            if (this.shadowRoot.getElementById("actualRank")) {
                this.shadowRoot.removeChild(this.shadowRoot.getElementById("actualRank"));
            }

            if (UserService.getInstance().isConnected() && Object.keys(this.rank).includes(this.league)) {
                let element = document.createElement("leaderboard-element");
                element.setPlayer(UserService.getInstance().user);
                element.rank = this.rank[this.league];
                element.id = "actualRank";
                this.shadowRoot.appendChild(element);
            }

            this.leagueData.map((player, i) => {
                const element = document.createElement("leaderboard-element");
                element.setPlayer(player);
                element.id = i + 1;
                element.rank = player.leagueRank;
                this.shadowRoot.getElementById("league-container").appendChild(element);

                if (this.shadowRoot.getElementById("actualRank") && UserService.getInstance().user.name === player.name) {
                    this.observer = new IntersectionObserver(
                        this.elementVisible.bind(this),
                        {
                            root: null,
                            rootMargin: "0px",
                            threshold: [0, 1]
                        }
                    );
                    this.observer.observe(this.shadowRoot.getElementById(i + 1));
                }
            });
        }
    }

    detectScrollDirection() {
        const currentScrollTop = window.scrollY || this.scrollTop;
        if (currentScrollTop > this.lastScrollTop) {
            this.scrollDirection = SCROLL_DIRECTION.UP;
        } else {
            this.scrollDirection = SCROLL_DIRECTION.DOWN;
        }
        this.lastScrollTop = currentScrollTop;
    }

    elementVisible(entries) {
        const boundingClientRect = entries[0].boundingClientRect;
        const intersectionRect = entries[0].intersectionRect;

        if (boundingClientRect.top === intersectionRect.top && boundingClientRect.bottom === intersectionRect.bottom) {
            this.shadowRoot.getElementById("actualRank").style.visibility = "hidden";
            this.shadowRoot.getElementById("actualRank").style.backgroundColor = "none";
        } else if (boundingClientRect.bottom === intersectionRect.bottom && entries[0].intersectionRatio !== 1 && this.scrollDirection === SCROLL_DIRECTION.DOWN) {
            this.shadowRoot.getElementById("actualRank").style.visibility = "hidden";
            this.shadowRoot.getElementById("actualRank").style.backgroundColor = "none";
        } else {
            this.shadowRoot.getElementById("actualRank").style.visibility = "visible";
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.observer) {
            this.observer.disconnect();
        }
    }
}