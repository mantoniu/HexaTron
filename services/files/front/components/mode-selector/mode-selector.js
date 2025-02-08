import {Component} from '../component/component.js';
import {CustomButton} from "../custom-button/custom-button.js";

export class ModeSelector extends Component {
    constructor() {
        super();

        CustomButton.register();
        this.gameCreationListener();
    }

    gameCreationListener() {
        GameService.getInstance().on(GameStatus.CREATED, () => {
            window.dispatchEvent(new CustomEvent("navigate", {detail: {route: "/game"}}));
        });
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.shadowRoot.getElementById("friendly").addEventListener("click",
            () => window.location.assign("/components/game-page/game-page.html"));
    }
}