import {Component} from '../component/component.js';
import {CustomButton} from "../custom-button/custom-button.js";

export class ModeSelector extends Component {
    constructor() {
        super();
        CustomButton.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.shadowRoot.getElementById("friendly").addEventListener("click",
            () => window.location.assign("/components/game-page/game-page.html"));
    }
}