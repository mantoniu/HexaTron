import {Component} from "../component/component.js";

const LEAGUES = Object.freeze({
    WOOD: "Wood",
    STONE: "Stone",
    IRON: "Iron",
    SILVER: "Silver",
    GOLD: "Gold",
    PLATINUM: "Platinum",
    DIAMOND: "Diamond"
});

const LEAGUE_ICONS = Object.freeze({
    [LEAGUES.WOOD]: "../../assets/leagues/wood.png",
    [LEAGUES.STONE]: "../../assets/leagues/stone.png",
    [LEAGUES.IRON]: "../../assets/leagues/iron.png",
    [LEAGUES.SILVER]: "../../assets/leagues/silver.png",
    [LEAGUES.GOLD]: "../../assets/leagues/gold.png",
    [LEAGUES.PLATINUM]: "../../assets/leagues/platinum.png",
    [LEAGUES.DIAMOND]: "../../assets/leagues/diamond.png",
});

export class RankDisplay extends Component {
    static get observedAttributes() {
        return ['league', 'elo'];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._rankText = this.shadowRoot.getElementById("rank-text");
        this._rankIcon = this.shadowRoot.getElementById("rank-icon");
        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue)
            this._update();
    }

    _update() {
        if (!this._rankText || !this._rankIcon)
            return;

        const league = this.getAttribute('league') || 'Unranked';
        const elo = this.getAttribute('elo') || '0';

        const iconSrc = LEAGUE_ICONS[league];
        if (iconSrc)
            this._rankIcon.src = iconSrc;

        this._rankText.innerText = `${league} League - ELO ${elo}`;
    }
}