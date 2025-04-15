import {userService} from "../../services/user-service.js";
import {PlayerKeys} from "../player-keys/player-keys.js";
import {PlayerColor} from "../player-color/player-color.js";
import {Component} from "../component/component.js";
import {SubmitButton} from "../submit-button/submit-button.js";

const MESSAGE = Object.freeze({
    KEY_ALREADY_ASSIGNED: {message: "The key is already assigned", type: "error"},
    COLOR_ALREADY_ASSIGNED: {message: "The color is already assigned", type: "error"},
    CHOOSE_NEW_KEY: {message: "Choose a new key by pressing it", type: "info"}
})

export class SettingsPortal extends Component {
    constructor() {
        super();

        PlayerKeys.register();
        PlayerColor.register();
        SubmitButton.register();

        this.settings = structuredClone(userService.user.parameters);
        this.buttonsActive = false;

        this.boundKeyListener = this.keyListener.bind(this);
        this.boundCancelModification = this.cancelModification.bind(this);

        this.currentEventDetail = null;
        this.addEventListener("keyModificationAsked", (e) => this.eventHandler(e));
        this.addEventListener("colorModificationAsked", (e) => this.eventHandler(e));
        this.addAutoCleanListener(document, "click", this.boundCancelModification);
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.settings.keysPlayers.forEach((value, i) => {
            const playerKeys = document.createElement("player-keys");
            playerKeys.setAttribute("id", `player${i + 1}`);
            playerKeys.data = value;
            playerKeys.color = this.settings.playersColors[i];
            this.shadowRoot.getElementById("keys").appendChild(playerKeys);
        });

        this.settings.playersColors.forEach((color, i) => {
            const playerColor = document.createElement("player-color");
            playerColor.setAttribute("id", `color${i + 1}`);
            playerColor.color = color;
            this.shadowRoot.getElementById("colors").appendChild(playerColor);
        });

        this.addAutoCleanListener(this.shadowRoot.querySelector("#validate"), "click", async () => await this.validate());
        this.addAutoCleanListener(this.shadowRoot.querySelector("#cancel"), "click", () => this.cancel());

        this.shadowRoot.getElementById("message").style.visibility = "hidden";
    }

    keyListener(event) {
        const index = this.currentEventDetail.componentID.match(/\d+$/) - 1;
        this.shadowRoot.getElementById("message").style.visibility = "hidden";
        if (this.settings.keysPlayers[index][this.currentEventDetail.index] === event.key.toLowerCase()) {
            this.shadowRoot.getElementById(this.currentEventDetail.componentID).resetKey(this.currentEventDetail.index);
            this.currentEventDetail = null;
            return;
        } else if (this.settings.keysPlayers.some(row => row.includes(event.key.toLowerCase()))) {
            this.activeMessage("message", MESSAGE.KEY_ALREADY_ASSIGNED);
            this.shadowRoot.getElementById(this.currentEventDetail.componentID).resetKey(this.currentEventDetail.index);
        } else {
            this.shadowRoot.getElementById(this.currentEventDetail.componentID).newKey(this.currentEventDetail.index, event.key.toLowerCase());
            this.settings.keysPlayers[index][this.currentEventDetail.index] = event.key.toLowerCase();
            this.shadowRoot.querySelectorAll("submit-button").forEach(element => element.classList.remove("buttons-disable"));
            this.buttonsActive = true;
        }
        this.currentEventDetail = null;
    };

    cancelModification(event) {
        event.stopImmediatePropagation();
        if (this.currentEventDetail && event.composedPath()[0] && event.composedPath()[0].nodeName !== "polygon") {
            this.shadowRoot.getElementById("message").style.visibility = "hidden";
            this.shadowRoot.getElementById(this.currentEventDetail.componentID).resetKey(this.currentEventDetail.index);
            document.removeEventListener("keydown", this.boundKeyListener);
            this.currentEventDetail = null;
            this.buttonsActive = false;
        }
    }

    eventHandler(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (event.type === "keyModificationAsked") {
            this.activeMessage("message", MESSAGE.CHOOSE_NEW_KEY);
            if (this.currentEventDetail) {
                this.shadowRoot.getElementById(this.currentEventDetail.componentID).resetKey(this.currentEventDetail.index);
                document.removeEventListener("keydown", this.boundKeyListener);
                if (Object.entries(event.detail).every(([key, value]) => this.currentEventDetail[key] === value)) {
                    this.currentEventDetail = null;
                    this.shadowRoot.getElementById("message").style.visibility = "hidden";
                    return;
                }
            }
            this.currentEventDetail = event.detail;
            this.addAutoCleanListener(document, "keydown", this.boundKeyListener, true);
        }
        if (event.type === "colorModificationAsked") {
            const index = event.detail.componentID.match(/\d+$/) - 1;
            if (event.detail.color === this.settings.playersColors[(index + 1) % 2]) {
                this.activeMessage("message", MESSAGE.COLOR_ALREADY_ASSIGNED);
                this.shadowRoot.getElementById(`color${index + 1}`).color = this.settings.playersColors[index];
            } else {
                this.settings.playersColors[index] = event.detail.color;
                this.shadowRoot.getElementById(`player${index + 1}`).changeColor(event.detail.color);
                this.shadowRoot.querySelectorAll("submit-button").forEach(element => element.classList.remove("buttons-disable"));
                this.buttonsActive = true;
            }
        }
    }

    async validate() {
        if (this.buttonsActive) {
            const res = await userService.updateUser({parameters: structuredClone(this.settings)});
            this._handleUpdateResponse(res);
            this.shadowRoot.querySelectorAll("submit-button").forEach(element => element.classList.add("buttons-disable"));
            this.buttonsActive = false;
        }
    }

    _handleUpdateResponse(res) {
        if (res.success) {
            this._createAlertMessageEvent("success", "Settings changed successfully");
            this.settings = structuredClone(userService.user.parameters);
        } else {
            this.cancel();
            this._createAlertMessageEvent("error", res.error);
        }
    }

    _createAlertMessageEvent(type, text) {
        this.dispatchEvent(new CustomEvent("createAlert", {
            bubbles: true,
            detail: {type, text}
        }));
    }

    cancel() {
        if (this.buttonsActive) {
            this.settings = structuredClone(userService.user.parameters);
            this.resetKeys();
            this.resetColors();
            this.shadowRoot.querySelectorAll("submit-button").forEach(element => element.classList.add("buttons-disable"));
            this.buttonsActive = false;
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback && super.disconnectedCallback();
    }

    resetKeys() {
        this.shadowRoot.querySelectorAll("player-keys").forEach((child, index) => {
            child.resetKeys(this.settings.keysPlayers[index]);
        });
    }

    resetColors() {
        this.settings.playersColors.forEach(
            (color, index) => {
                this.shadowRoot.getElementById(`color${index + 1}`).color = color;
                this.shadowRoot.getElementById(`player${index + 1}`).changeColor(color);
            });
    }

    activeMessage(id, information) {
        this.shadowRoot.getElementById(id).textContent = information.message;
        this.shadowRoot.getElementById(id).setAttribute("type", information.type);
        this.shadowRoot.getElementById(id).style.visibility = "visible";
    }
}