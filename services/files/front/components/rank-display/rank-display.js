import {Component} from "../component/component.js";
import {LEAGUE_ICONS} from "../../js/utils.js";

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