export class Component extends HTMLElement {
    static _resourcesCache = new Map();

    constructor() {
        super();

        this._listeners = new Set();
        this.attachShadow({ mode: 'open' });

        this._connectedPromise = new Promise((resolve) => {
            this._resolveConnected = resolve;
        });
    }

    static get elementName() {
        return this.name
            .replace(/([A-Z])/g, (match, letter, offset) =>
                offset > 0 ? `-${letter}` : letter
            )
            .toLowerCase();
    }

    static register() {
        if (!customElements.get(this.elementName))
            customElements.define(this.elementName, this);
    }

    get whenConnected() {
        return this._connectedPromise;
    }

    async connectedCallback() {
        try {
            await this.loadResources();
            this._resolveConnected();
        } catch (err) {
            console.error(`Error in component ${this.constructor.elementName}:`, err);
        }
    }

    async loadResources() {
        const elementName = this.constructor.elementName;
        const cachedResources = Component._resourcesCache.get(elementName);

        if (cachedResources) {
            await new Promise(resolve => setTimeout(resolve, 0));

            this.render(cachedResources.html, cachedResources.css);
            return;
        }

        const [html, css] = await Promise.all([
            this.fetchResource('html'),
            this.fetchResource('css')
        ]);

        Component._resourcesCache.set(elementName, {html, css});
        this.render(html, css);
    }

    initializeElements(selectors) {
        return Object.fromEntries(
            Object.entries(selectors).map(([key, id]) => [key, this.shadowRoot.getElementById(id)])
        );
    }

    async fetchResource(type) {
        const response = await fetch(`/components/${this.constructor.elementName}/${this.constructor.elementName}.${type}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${type.toUpperCase()} for component ${this.constructor.elementName}`);
        }
        return response.text();
    }

    render(html, css) {
        this.shadowRoot.innerHTML = `
            <style>${css}</style>
            ${html}
        `;
    }

    addAutoCleanListener(target, event, handler, once = false) {
        target.addEventListener(event, handler, {once: once});
        this._listeners.add({target, event, handler});
    }

    disconnectedCallback() {
        this._listeners.forEach(({target, event, handler}) => {
            target.removeEventListener(event, handler);
        });
        this._listeners.clear();
    }
}