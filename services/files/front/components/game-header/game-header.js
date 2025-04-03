import {convertRemToPixels, hexToRGB, rgbToHex, waitForElm} from "../../js/Utils.js";
import {gameService, GameStatus} from "../../services/game-service.js";
import {userService} from "../../services/user-service.js";
import {ListenerComponent} from "../component/listener-component.js";

export class GameHeader extends ListenerComponent {
    constructor() {
        super();

        this._roundEndHandler = null;
        this.players = [];
        this.resizeObserver = new ResizeObserver(() => this.updateSizes());
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._canvas = this.shadowRoot.getElementById("header");
        this._canvas.width = window.screen.width / 5;
        this._canvas.height = window.screen.height / 5;
        this.context = this._canvas.getContext("2d");
        this.context.lineWidth = 5;
        this.context.lineJoin = "round";
        this.context.strokeStyle = "#4e5256";

        this.draw();

        if (gameService.isGameCreated())
            await this.receiveData(gameService.game.players);

        this._roundEndHandler = (data) => {
            if (data.status === "winner") {
                const colorIndex = +(data.winner !== userService.user._id);
                this.fillHexagon(data.round + 1, userService.user.parameters.playersColors[colorIndex]);
            } else this.fillHexagon(data.round + 1, "#D3D3D3");
        };

        this.addAutomaticEventListener(gameService, GameStatus.CREATED,
            () => this.receiveData(gameService.game.players));

        this.addAutomaticEventListener(gameService, GameStatus.ROUND_END, (data) => this._roundEndHandler(data));

        setTimeout(() => {
            this.players = [...this.shadowRoot.querySelectorAll(".player")];
            this.resizeObserver.observe(this);
            this.updateSizes();
        }, 0);
    }

    updateSizes() {
        const widths = this.players.map(player => player.scrollWidth);
        const maxWidth = Math.max(...widths);

        this.players.forEach(player => {
            player.style.minWidth = `${maxWidth}px`;
            player.style.flex = `1 1 ${maxWidth}px`;
        });
    }

    calculateUtils() {
        const width = this.context.canvas.width;
        const height = this.context.canvas.height;
        const pxSize = convertRemToPixels(4);
        this.context.font = pxSize + "px serif";
        const size = width / 7;
        const position = [(this.context.lineWidth + Math.sqrt(3) * size) / 2, width / 2, width - (this.context.lineWidth + Math.sqrt(3) * size) / 2];
        return [height, size, position];
    }

    drawHexagon(numberOfSides, angleStep, centerX, centerY, size, fill) {
        this.context.beginPath();

        for (let i = 0; i < numberOfSides; i++) {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + size * Math.cos(angle);
            const y = centerY + size * Math.sin(angle);

            if (i === 0) {
                this.context.moveTo(x, y);
            } else {
                this.context.lineTo(x, y);
            }
        }

        this.context.closePath();

        fill ? this.context.fill() : this.context.stroke();

    }

    drawHeader(n, color, fill) {
        const [height, size, position] = this.calculateUtils();

        this.context.fillStyle = color;
        this.context.beginPath();

        const numberOfSides = 6;
        const angleStep = (Math.PI * 2) / numberOfSides;
        const centerX = position[n - 1];
        const centerY = height / 2;

        if (fill)
            this.drawHexagon(numberOfSides, angleStep, centerX, centerY, size, fill);
        this.drawHexagon(numberOfSides, angleStep, centerX, centerY, size, false);

        const backGroundRGB = hexToRGB(this.context.fillStyle);
        const luminosityBackground = (backGroundRGB[0] * 299 + backGroundRGB[1] * 587 + backGroundRGB[2] * 114) / 1000;
        this.context.fillStyle = rgbToHex([luminosityBackground < 128 ? 255 : 0, luminosityBackground < 128 ? 255 : 0, luminosityBackground < 128 ? 255 : 0]);

        const centeredWidth = this.context.measureText(n).width / 2;
        const centeredHeight = this.context.measureText(n).width / 2;
        this.context.fillText(n, position[n - 1] - centeredWidth, height / 2 + centeredHeight * 3 / 2);
    }

    draw() {
        const [height, size, position] = this.calculateUtils();
        for (let k = 1; k < 4; k++) {
            this.drawHeader(k, "#ffffff", false);
            if (k !== 3) {
                this.context.beginPath();
                this.context.moveTo(position[k - 1] + Math.sqrt(3) * size / 2, height / 2);
                this.context.lineTo(position[k] - Math.sqrt(3) * size / 2, height / 2);
                this.context.stroke();
            }
        }
    }

    fillHexagon(n, color) {
        this.drawHeader(n, color, true);
    }

    async receiveData(players) {
        const ids = Object.keys(players);
        let n = 1;
        for (let k = 0; k < ids.length; k++) {
            n = userService.user._id === ids[k] ? 1 : 2;
            waitForElm(this, "name-player" + n).then((element) => {
                element.innerText = players[ids[k]]._name;
            });

            waitForElm(this, "pp-player" + n).then((element) => {
                if (element) {
                    element.src = "../../assets/profile.svg";
                }
            });
        }
    }
}
