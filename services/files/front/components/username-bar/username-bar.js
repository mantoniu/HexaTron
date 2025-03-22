import {Component} from "../component/component.js";

export class UsernameBar extends Component {
    static get observedAttributes() {
        return ['username'];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.addEventListener("click", () => {
            this.dispatchEvent(new CustomEvent("conv-return", {
                bubbles: true,
                composed: true,
            }));
        });

        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'username' && this.shadowRoot) {
            this._username = newValue;
            this._update();
        }
    }

    _update() {
        const usernameElem = this.shadowRoot.getElementById("username");
        if (usernameElem && this._username)
            usernameElem.textContent = this._username;
    }
}