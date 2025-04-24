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

        this._friendList = this.shadowRoot.getElementById("friend-list");
        this._notFriendList = this.shadowRoot.getElementById("not-friend-list");

        await this._friendList.whenConnected;
        await this._notFriendList.whenConnected;

        this._friendList.setStatusAccepted(["friends"]);
        this._notFriendList.setStatusAccepted(["pending", "requested"]);

        this.initialize();
        notificationService.removeFriendsNotifications();
    }

    initialize() {
        this.shadowRoot.getElementById("friends-part").style.display = "flex";
        this._friendList.setFriendsList(userService.user.friends);
        this._notFriendList.setFriendsList(userService.user.friends);
    }

    friendUpdateEvent() {
        this._friendList?.setFriendsList(userService.user.friends);
        this._notFriendList?.setFriendsList(userService.user.friends);
    }

    deleteFriend(data) {
        this._friendList?.removeFromList(data.id);
        this._notFriendList?.removeFromList(data.id);
    }
}