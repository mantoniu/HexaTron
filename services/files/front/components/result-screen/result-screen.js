import {CustomButton} from "../custom-button/custom-button.js";
import {GameHeader} from "../game-header/game-header.js";
import {GameResult, gameService, GameStatus} from "../../services/game-service.js";
import {userService} from "../../services/user-service.js";
import {ListenerComponent} from "../component/listener-component.js";

export class ResultScreen extends ListenerComponent {
    constructor() {
        super();

        CustomButton.register();
        GameHeader.register();

        this.end = false;
        this.results = {};
    }

    static get observedAttributes() {
        return ["end", "results"];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "end":
                this.end = JSON.parse(newValue);
                this.move();
                break;
            case "results":
                this.results = JSON.parse(newValue);
                this.update_results();
                break;
        }
    }

    async connectedCallback() {
        await super.connectedCallback();

        if (gameService.isGameCreated())
            this._launchAnimation();

        this.addAutomaticEventListener(gameService, GameStatus.CREATED, () =>
            this._launchAnimation());

        const backToMenu = this.shadowRoot.getElementById("back-to-menu");
        this.addAutoCleanListener(backToMenu, "click", () => {
            window.dispatchEvent(new CustomEvent("navigate", {
                detail: {route: `/`}
            }));
        });
        this.addAutoCleanListener(this, "transitionend", () =>
            this.showResult());
        this.move();
        this.showResult();
    }

    _launchAnimation() {
        this.classList.remove("fall-animation");
        void this.offsetWidth;
        this.classList.add("fall-animation");
    }

    move() {
        if (this.end) {
            this.style.position = "relative";
            this.style.transform = "translateY(30vh)";
        }
    }

    showResult() {
        this.style.maxHeight = this.end ? "80%" : "5rem";
    }

    setHeader(element) {
        const header = this.shadowRoot.querySelector("game-header");
        this.shadowRoot.replaceChild(element, header);
    }

    update_results() {
        const status = this.shadowRoot.getElementById("status");
        const score = this.shadowRoot.getElementById("score");

        switch (this.results.status) {
            case GameResult.WIN:
                status.textContent = GameResult.WIN;
                status.style.color = "var(--win-green)";
                score.textContent = `You win against ${this.results.winners[0]}`;
                break;
            case GameResult.DRAW:
                status.textContent = GameResult.DRAW;
                score.textContent = `You tied against ${this.results.winners.filter(name => name !== userService.user.name)[0]}`;
                break;
            case GameResult.LOOSE:
                status.textContent = GameResult.LOOSE;
                status.style.color = "var(--loose-red)";
                score.textContent = `${this.results.winners[0]} win against you`;
                break;
            default:
                console.warn("Game result type not specified");
        }
    }
}