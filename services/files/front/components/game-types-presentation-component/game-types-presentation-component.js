import {ListenerComponent} from "../component/listener-component.js";

export const gameTypes = ["local", "ai", "ranked", "friendly"];

export class GameTypesPresentationComponent extends ListenerComponent {
    constructor() {
        super();
    }

    async connectedCallback() {
        await super.connectedCallback();
    }
}