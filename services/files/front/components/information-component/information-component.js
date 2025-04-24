import {Component} from "../component/component.js";
import {SubmitButton} from "../submit-button/submit-button.js";
import {PlayerKeys} from "../player-keys/player-keys.js";
import {userService} from "../../services/user-service.js";
import {GameTypesPresentationComponent} from "../game-types-presentation-component/game-types-presentation-component.js";
import {InformationsPageComponent} from "../informations-page-component/informations-page-component.js";
import {mobile} from "../../js/config.js";
import {GameJoystick} from "../game-joystick/game-joystick.js";

export class InformationComponent extends Component {
    constructor() {
        super();

        SubmitButton.register();
        PlayerKeys.register();
        GameTypesPresentationComponent.register();
        InformationsPageComponent.register();
        GameJoystick.register();

        this._touchStartX = 0;
        this._touchEndX = 0;
        this._actualSlide = 0;
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.addAutoCleanListener(window, "resize", () => this.flexOrientation());

        this._initialize();
    }

    _initialize() {
        const shadowRoot = this.shadowRoot;
        this._totalSlide = shadowRoot.querySelectorAll(".page").length;

        if (mobile) {
            this.addEventListener("touchstart", (e) => {
                this._touchStartX = e.changedTouches[0].screenX;
            });

            this.addEventListener("touchend", (e) => {
                this._touchEndX = e.changedTouches[0].screenX;
                this.handleSwipeGesture();
            });
        }


        const indicators = shadowRoot.getElementById("indicators");
        for (let i = 0; i < this._totalSlide; i++) {
            const indicator = document.createElement("div");
            indicator.classList.add("indicator");
            this.addAutoCleanListener(indicator, "click", () => this.goToSlide(i));
            if (indicator) {
                indicators.appendChild(indicator);
            }
        }
        this.goToSlide(this._actualSlide);
        const next = shadowRoot.getElementById("next");
        if (next)
            this.addAutoCleanListener(next, "click", () => this.goToSlide(this._actualSlide + 1));
        const previous = shadowRoot.getElementById("previous");
        this.addAutoCleanListener(previous, "click", () => this.goToSlide(this._actualSlide - 1));

        const closeButton = this.shadowRoot.getElementById("close-btn");
        if (closeButton)
            closeButton.addEventListener("click", () => this.remove());

        for (let i = 0; i < 2; i++) {
            const controls = shadowRoot.getElementById("controls");
            const parameters = userService.user.parameters;
            const controlPlayer = document.createElement("player-keys");
            controlPlayer.setAttribute("id", `player${i + 1}`);
            controlPlayer.setAttribute("activated", false);
            controlPlayer.data = parameters.keysPlayers[i];
            controlPlayer.color = parameters.playersColors[i];
            controls.appendChild(controlPlayer);
        }

        if (mobile)
            shadowRoot.getElementById("mobile").style.display = "block";
        else
            shadowRoot.getElementById("computer").style.display = "block";

        this.flexOrientation();
    }

    goToSlide(i) {
        this._actualSlide = i;
        const shadowRoot = this.shadowRoot;
        const next = this.shadowRoot.getElementById("next");
        const previous = this.shadowRoot.getElementById("previous");
        next.style.visibility = "visible";
        previous.style.visibility = "visible";
        if (i === this._totalSlide - 1)
            next.style.visibility = "hidden";
        else if (i === 0)
            previous.style.visibility = "hidden";

        const indicators = shadowRoot.querySelectorAll(".indicator");
        const pages = shadowRoot.querySelectorAll(".page");
        Array.from(pages).forEach(((page, k) => i === k ? page.style.display = "grid" : page.style.display = "none"));
        Array.from(indicators).forEach(((element, k) => i === k ? element.classList.add("active") : element.classList.remove("active")));
    }

    flexOrientation() {
        const height = window.innerHeight;
        const el = this.shadowRoot.getElementById("1");
        if (height < 440) {
            el.style.setProperty("--flex-direction", "row");
        } else {
            el.style.setProperty("--flex-direction", "column");
        }
    }

    handleSwipeGesture() {
        const diff = this._touchEndX - this._touchStartX;

        this._touchStartX = 0;
        this._touchEndX = 0;
        if (Math.abs(diff) < 50) return; // swipe trop petit, on ignore

        if (diff > 0) {
            this.goToSlide(this._actualSlide === 0 ? this._actualSlide : this._actualSlide - 1);
        } else {
            this.goToSlide(this._actualSlide === this._totalSlide - 1 ? this._actualSlide : this._actualSlide + 1);
        }
    }
}