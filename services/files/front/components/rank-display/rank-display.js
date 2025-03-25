import {Component} from "../component/component.js";

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

        let iconSrc;

        switch (league.toLowerCase()) {
            case 'iron':
                iconSrc = '/path/to/iron-icon.png';
                break;
            case 'bronze':
                iconSrc = '/path/to/bronze-icon.png';
                break;
            case 'silver':
                iconSrc = '/path/to/silver-icon.png';
                break;
            default:
                iconSrc = '/api/placeholder/24/24';
        }

        this._rankIcon.src = iconSrc;
        this._rankText.innerText = `${league} League - ELO ${elo}`;
    }
}