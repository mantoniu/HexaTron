import {FriendsList} from "../friends-list/friends-list.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";
import {ListenerComponent} from "../component/listener-component.js";
import {SearchFriendComponent} from "../search-friend-component/search-friend-component.js";
import {notificationService} from "../../services/notifications-service.js";

export class FriendsPortal extends ListenerComponent {
    constructor() {
        super();

        FriendsList.register();
        SearchFriendComponent.register();

        this.addAutomaticEventListener(userService, USER_EVENTS.UPDATE_FRIEND, (_) => this.friendUpdateEvent());
        this.addAutomaticEventListener(userService, USER_EVENTS.REMOVE_FRIEND, (data) => this.deleteFriend(data));
        this.addAutomaticEventListener(userService, USER_EVENTS.DELETE_USER, (data) => this.deleteFriend(data));
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.shadowRoot.getElementById("friend-list").setStatusAccepted(["friends"]);
        this.shadowRoot.getElementById("not-friend-list").setStatusAccepted(["pending", "requested"]);

        this.initialize();
        notificationService.removeFriendsNotifications();
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
}