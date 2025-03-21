import {FriendsList} from "../friends-list/friends-list.js";
import {userService} from "../../services/user-service.js";
import {ListenerComponent} from "../component/listener-component.js";

export class FriendsPortal extends ListenerComponent {
    constructor() {
        super();

        FriendsList.register();

        this.profilElement = null;

        this.addAutomaticEventListener(userService, "updateFriends", (data) => this.friendUpdateEvent(data));
        this.addAutomaticEventListener(userService, "deleteFriend", (data) => this.friendUpdateEvent(data));
        this.addAutoCleanListener(this, "watchProfile", (event) => this.watchProfileEvent(event));
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.shadowRoot.getElementById("friend-list").setStatusAccepted(["friends"]);
        this.shadowRoot.getElementById("not-friend-list").setStatusAccepted(["pending", "requested"]);

        this.initialize();
    }

    initialize() {
        if (this.profilElement) {
            this.shadowRoot.appendChild(this.profilElement);
            if (this.shadowRoot.getElementById("friends-part"))
                this.shadowRoot.getElementById("friends-part").style.display = "none";
        } else {
            this.shadowRoot.getElementById("friend-list").setFriendsList(userService.user.friends);
            this.shadowRoot.getElementById("not-friend-list").setFriendsList(userService.user.friends);
        }
    }

    watchProfileEvent(event) {
        event.stopPropagation();

        this.profilElement = document.createElement("user-profile");

        this.profilElement.setAttribute("id", event.detail.player._id);
        this.profilElement.setAttribute("user", JSON.stringify(event.detail.player));
        this.profilElement.setAttribute("editable", false);
        this.profilElement.setAttribute("part", "user-friend-part");

        this.profilElement.style.display = "block";

        this.initialize();
    }

    friendUpdateEvent(data) {
        if (this.profilElement?.style.display === "block") {
            let user = data.friendData;
            user._id = data.id;
            this.profilElement.setAttribute("user", JSON.stringify(user));
        }
        this.shadowRoot.getElementById("friend-list").setFriendsList(userService.user.friends);
        this.shadowRoot.getElementById("not-friend-list").setFriendsList(userService.user.friends);
    }
}