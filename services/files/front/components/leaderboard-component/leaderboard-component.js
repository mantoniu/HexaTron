import {Component} from "../component/component.js";
import {LeaderboardElement} from "../leaderboard-element/leaderboard-element.js";
import {userService} from "../../services/user-service.js";

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
        this.voidElement = null;
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

        const shadowRoot = this.shadowRoot;
        const leagueContainer = shadowRoot.getElementById("league-container");

        if (!leagueContainer)
            return;

        leagueContainer.innerHTML = "";
        leagueContainer.classList.add("empty");

        if (this.isConnected) {
            if (this.leagueData) {
                leagueContainer.classList.remove("empty");
                const actualRank = shadowRoot.getElementById("actualRank");

                if (actualRank) {
                    shadowRoot.removeChild(actualRank);
                }

                if (userService.isConnected() && Object.keys(this.rank).includes(this.league)) {
                    let element = document.createElement("leaderboard-element");
                    element.setPlayer(userService.user);
                    element.rank = this.rank[this.league];
                    element.id = "actualRank";
                    element.classList.add("user");
                    leagueContainer.appendChild(element);
                }

                this.leagueData.map((player, i) => {
                    const element = document.createElement("leaderboard-element");
                    element.setPlayer(player);
                    element.id = i + 1;
                    element.rank = player.leagueRank;
                    if (player._id === userService.user._id)
                        element.classList.add("user");
                    leagueContainer.appendChild(element);

                    if (actualRank && userService.user.name === player.name) {
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

                this.voidElement = document.createElement("leaderboard-element");
                leagueContainer.appendChild(this.voidElement);
                this.voidElement.style.display = "none";
                this.voidElement.classList.add("void");
            } else
                leagueContainer.textContent = "Nobody here for the moment";
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
            this.voidElement.style.display = "none";
        } else if (boundingClientRect.bottom === intersectionRect.bottom && entries[0].intersectionRatio !== 1 && this.scrollDirection === SCROLL_DIRECTION.DOWN) {
            this.shadowRoot.getElementById("actualRank").style.visibility = "hidden";
            this.voidElement.style.display = "none";
        } else {
            this.shadowRoot.getElementById("actualRank").style.visibility = "visible";
            this.voidElement.style.display = "flex";
        }
    }


    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.observer)
            this.observer.disconnect();
    }
}