import {ListenerComponent} from "../component/listener-component.js";

export class GameTypesPresentationComponent extends ListenerComponent {
    constructor() {
        super();
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._initialize();
    }

    _initialize() {
        const shadowRoot = this.shadowRoot;
        const title = shadowRoot.getElementById("title");
        const icon = shadowRoot.getElementById("icon-game-type");

        if (title)
            title.textContent = this.getAttribute("title") || "";
        if (icon)
            icon.src = this.getAttribute("icon") || "";
    }
}