import {Component} from "../component/component.js";

export class ToggleGroup extends Component {
    constructor() {
        super();

        this._options = [];
        this._selected = "";
    }

    static get observedAttributes() {
        return ["options", "selected"];
    }

    async connectedCallback() {
        await super.connectedCallback();

        this._tabContainer = this.shadowRoot.getElementById("tab-container");
        this._update();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "options":
                this._options = JSON.parse(newValue);
                break;
            case "selected":
                this._selected = newValue;
                break;
        }

        this._update();
    }

    _update() {
        if (!this._tabContainer)
            return;

        const existingTabs = Array.from(this._tabContainer.children);

        if (existingTabs.length === this._options.length)
            this._updateTabs(existingTabs);
        else this._createTabs();
    }

    _updateTabs(tabs) {
        tabs.forEach(tab => {
            const value = tab.dataset.value;
            if (value === this._selected) {
                tab.classList.add("active");
            } else {
                tab.classList.remove("active");
            }
        });
    }

    _createTabs() {
        this._tabContainer.innerHTML = "";
        this._options.forEach(option => {
            const tab = document.createElement("div");
            tab.classList.add("tab");
            tab.textContent = option.label;
            tab.dataset.value = option.value;

            if (option.value === this._selected)
                tab.classList.add("active");

            tab.addEventListener("click", () => this._select(option.value));

            this._tabContainer.appendChild(tab);
        });
    }

    _select(value) {
        if (this._selected !== value) {
            this._selected = value;
            this.setAttribute("selected", value);
            this._update();

            this.dispatchEvent(new CustomEvent("change", {detail: {value}}));
        }
    }
}