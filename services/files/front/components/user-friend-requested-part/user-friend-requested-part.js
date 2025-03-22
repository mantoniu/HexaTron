import {Component} from "../component/component.js";

export class UserFriendRequestedPart extends Component {

    constructor() {
        super();
    }

    async connectedCallback() {
        await super.connectedCallback();
        const element = document.createElement("p");
        if (JSON.parse(this.getAttribute("short-version"))) {
            element.textContent = "Pending";
        } else {
            element.textContent = "Pending acceptance of the friend request";
        }
        this.shadowRoot.appendChild(element);
    }
}