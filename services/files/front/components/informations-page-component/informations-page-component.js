import {ListenerComponent} from "../component/listener-component.js";


export class InformationsPageComponent extends ListenerComponent {
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

        if (title)
            title.textContent = this.getAttribute("title") || "";
    }
}