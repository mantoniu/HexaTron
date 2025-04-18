import {Component} from "../component/component.js";
import {SubmitButton} from "../submit-button/submit-button.js";
import {PlayerKeys} from "../player-keys/player-keys.js";
import {userService} from "../../services/user-service.js";

export class ModalComponent extends Component {
    constructor() {
        super();

        SubmitButton.register();
        PlayerKeys.register();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._initialize();
    }

    _initialize() {
        const shadowRoot = this.shadowRoot;
        this.totalSlide = shadowRoot.querySelectorAll(".page").length;

        this.actualSlide = 0;
        const indicators = shadowRoot.getElementById("indicators");
        for (let i = 0; i < this.totalSlide; i++) {
            const indicator = document.createElement("div");
            indicator.classList.add("indicator");
            this.addAutoCleanListener(indicator, "click", () => this.goToSlide(i));
            if (indicator) {
                indicators.appendChild(indicator);
            }
        }
        this.goToSlide(this.actualSlide);
        const next = shadowRoot.getElementById("next");
        if (next)
            this.addAutoCleanListener(next, "click", () => this.goToSlide(this.actualSlide + 1));
        const previous = shadowRoot.getElementById("previous");
        this.addAutoCleanListener(previous, "click", () => this.goToSlide(this.actualSlide - 1));

        const closeButton = this.shadowRoot.getElementById("close-btn");
        if (closeButton)
            closeButton.addEventListener("click", () => this.remove());

        const controls = shadowRoot.getElementById("controls");
        const parameters = userService.user.parameters;
        const controlPlayer1 = document.createElement("player-keys");
        controlPlayer1.setAttribute("id", "player1");
        controlPlayer1.data = parameters.keysPlayers[0];
        controlPlayer1.color = parameters.playersColors[0];
        controls.appendChild(controlPlayer1);

        const controlPlayer2 = document.createElement("player-keys");
        controlPlayer2.setAttribute("id", "player2");
        controlPlayer2.data = parameters.keysPlayers[1];
        controlPlayer2.color = parameters.playersColors[1];
        controls.appendChild(controlPlayer2);
    }

    goToSlide(i) {
        this.actualSlide = i;
        const shadowRoot = this.shadowRoot;
        const indicators = shadowRoot.querySelectorAll(".indicator");
        Array.from(indicators).forEach(((element, k) => i === k ? element.classList.add("active") : element.classList.remove("active")));

        const next = this.shadowRoot.getElementById("next");
        const previous = this.shadowRoot.getElementById("previous");
        next.style.visibility = "visible";
        previous.style.visibility = "visible";
        if (i === this.totalSlide - 1)
            next.style.visibility = "hidden";
        else if (i === 0)
            previous.style.visibility = "hidden";

        const pages = shadowRoot.querySelectorAll(".page");
        Array.from(pages).forEach(((page, k) => i === k ? page.style.display = "grid" : page.style.display = "none"));
    }
}