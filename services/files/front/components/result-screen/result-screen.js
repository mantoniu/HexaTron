import {Component} from "../component/component.js";
import {CustomButton} from "../custom-button/custom-button.js";
import {GameHeader} from "../game-header/game-header.js";
import {GameResult} from "../../services/game-service.js";
import {userService} from "../../services/user-service.js";

export class ResultScreen extends Component {
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
                console.log(newValue);
                this.results = JSON.parse(newValue);
                this.update_results();
                break;
        }
    }

    async connectedCallback() {
        await super.connectedCallback();

        const backToMenu = this.shadowRoot.getElementById("back-to-menu");
        this.addAutoCleanListener(backToMenu, "click", () => window.location.href = "/");
        this.addAutoCleanListener(this, "transitionend", (event) => {
            console.log(event);
            this.showResult();
        });
        this.move();
        this.showResult();
    }

    move() {
        if (this.end) {
            this.style.position = "relative";
            this.style.transform = "translateY(30vh)";
        }
    }

    showResult() {
        const result = this.shadowRoot.getElementById("result");
        if (result) {
            result.style.display = this.end ? "flex" : "none";
        }
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
                score.textContent = `You win against ${this.results.winners[0]} with a score of ${this.results.score}`;
                break;
            case GameResult.DRAW:
                status.textContent = GameResult.DRAW;
                score.textContent = `You tied against ${this.results.winners.filter(name => name !== userService.user.name)[0]} with a score of ${this.results.score}`;
                break;
            case GameResult.LOOSE:
                status.textContent = GameResult.LOOSE;
                status.style.color = "var(--loose-red)";
                score.textContent = `${this.results.winners[0]} win against you with a score of ${this.results.score}`;
                break;
            default:
                console.warn("Game result type not specified");
        }
    }
}