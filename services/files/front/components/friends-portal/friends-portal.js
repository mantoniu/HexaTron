import {Component} from "../component/component.js";
import {FriendsList} from "../friends-list/friends-list.js";
import {NotFriendsList} from "../not-friends-list/not-friends-list.js";

export class FriendsPortal extends Component {
    constructor() {
        super();

        FriendsList.register();
        NotFriendsList.register();
    }

    async connectedCallback() {
        await super.connectedCallback();
    }
}