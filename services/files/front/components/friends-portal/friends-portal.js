import {FriendsList} from "../friends-list/friends-list.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";
import {ListenerComponent} from "../component/listener-component.js";
import {SearchFriendComponent} from "../search-friend-component/search-friend-component.js";
import {PopupComponent} from "../popup-component/popup-component.js";

export class FriendsPortal extends ListenerComponent {
    constructor() {
        super();

        FriendsList.register();
        SearchFriendComponent.register();
        PopupComponent.register();

        this.addAutomaticEventListener(userService, USER_EVENTS.UPDATE_FRIEND, (_) => this.friendUpdateEvent());
        this.addAutomaticEventListener(userService, USER_EVENTS.DELETE_FRIEND, (data) => this.deleteFriend(data));
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.shadowRoot.getElementById("friend-list").setStatusAccepted(["friends"]);
        this.shadowRoot.getElementById("not-friend-list").setStatusAccepted(["pending", "requested"]);

        this.initialize();
    }

    initialize() {
        this.shadowRoot.getElementById("friends-part").style.display = "flex";
        this.shadowRoot.getElementById("friend-list").setFriendsList(userService.user.friends);
        this.shadowRoot.getElementById("not-friend-list").setFriendsList(userService.user.friends);
    }

    friendUpdateEvent() {
        this.shadowRoot.getElementById("friend-list")?.setFriendsList(userService.user.friends);
        this.shadowRoot.getElementById("not-friend-list")?.setFriendsList(userService.user.friends);
    }

    deleteFriend(data) {
        this.shadowRoot.getElementById("friend-list")?.removeFromList(data.id);
        this.shadowRoot.getElementById("not-friend-list")?.removeFromList(data.id);
    }

    createPopUp() {
        const popup = document.createElement("popup-component");
        this.shadowRoot.appendChild(popup);
        popup.setAttribute("text", "The user has been deleted");
        popup.setAttribute("color", "#dc3545");
        popup.open();
    }
}