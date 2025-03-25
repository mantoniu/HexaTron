import {ToggleGroup} from "../toggle-group/toggle-group.js";
import {ChatBox} from "../chat-box/chat-box.js";
import {FriendMessages} from "../friend-messages/friend-messages.js";
import {ListenerComponent} from "../component/listener-component.js";
import {CHAT_EVENTS, chatService} from "../../services/chat-service.js";
import {USER_EVENTS, userService} from "../../services/user-service.js";

export class ChatPortal extends ListenerComponent {
    constructor() {
        super();

        ChatBox.register();
        FriendMessages.register();
        ToggleGroup.register();
        this._toggleChoice = "global";
    }

    async connectedCallback() {
        await super.connectedCallback();
        this._content = this.shadowRoot.getElementById("content");

        await this.loadContent();
        this._setupListeners();
    }

    _setupPortalListeners() {
        this.shadowRoot.getElementById("chat-type").addEventListener("change", async (event) => {
            this._toggleChoice = event.detail.value;
            await this.loadContent();
        });

        this.addAutoCleanListener(this, "open-conversation", async (event) => {
            const conversation = await chatService.getConversation(event.detail.conversationId);
            console.log(conversation);
            this._openChatBox(conversation);
        });

        this.addAutoCleanListener(this, "conv-return", async (event) => {
            await this._openFriendList();
            event.stopPropagation();
        });

        this.addAutomaticEventListener(userService, USER_EVENTS.UPDATE_FRIEND, async (friend) => {
            chatService.updateFriend(friend);
        });
    }

    _setupChatListeners() {
        this.addAutomaticEventListener(chatService, CHAT_EVENTS.MESSAGE_ADDED, async (conversationId, message) => {
            const chatBox = this.shadowRoot.querySelector("chat-box");
            if (chatBox && chatBox.getAttribute("id") === conversationId) {
                chatBox.messageAdded(conversationId, message);

                if (message.senderId !== userService.user._id)
                    await chatService.markAsRead(conversationId, message._id);
            }

            this._updateFriendMessage(conversationId, message);
        });

        this.addAutomaticEventListener(chatService, CHAT_EVENTS.MESSAGE_SENT, (tempId, defMessage, conversationId) => {
            const chatBox = this.shadowRoot.querySelector("chat-box");
            if (chatBox && chatBox.getAttribute("id") === conversationId)
                chatBox.messageSent(tempId, defMessage);
        });

        this.addAutomaticEventListener(chatService, CHAT_EVENTS.MESSAGE_DELETED, (conversationId, messageId) => {
            const chatBox = this.shadowRoot.querySelector("chat-box");
            if (chatBox && chatBox.getAttribute("id") === conversationId)
                chatBox.messageDeleted(conversationId, messageId);
        });

        this.addAutomaticEventListener(chatService, CHAT_EVENTS.NEW_CONVERSATION, async () => {
            await this._openFriendList();
        });

        this.addAutomaticEventListener(chatService, CHAT_EVENTS.CONVERSATIONS_UPDATED, async () => {
            const chatBox = this.shadowRoot.querySelector("chat-box");
            if (chatBox) {
                const conversation = await chatService.getConversation(chatBox.id);
                if (conversation)
                    chatBox.refresh(conversation);
            } else {
                await this.loadContent();
            }
        });
    }

    _setupListeners() {
        this._setupPortalListeners();
        this._setupChatListeners();
    }

    async _changeToggleSelected(value) {
        this._toggleChoice = value;
        this.shadowRoot.getElementById("chat-type").setAttribute("selected", value);
    }

    _openChatBox(conversation) {
        this._content.innerHTML = "";
        const chatBox = document.createElement("chat-box");
        this._content.appendChild(chatBox);

        const friendUsername = conversation.participants?.[0]?.name;
        const messages = (Array.from(conversation.messages.values()) ?? []);
        chatBox.setAttribute("id", conversation._id);

        chatBox.whenConnected.then(() =>
            chatBox.initialize(messages, friendUsername, userService.user._id));

        this.addAutoCleanListener(chatBox, "new-message", (event) => {
            const {conversationId, message} = event.detail;
            chatService.sendMessage(conversationId, message);
        });

        this.addAutoCleanListener(chatBox, "delete-message", (event) => {
            const {conversationId, messageId} = event.detail;
            chatService.deleteMessage(conversationId, messageId);
        });
    }

    async _openFriendList() {
        this._content.innerHTML = "";
        const friendMessages = document.createElement("friend-messages");
        this._content.appendChild(friendMessages);
        const conversations = await chatService.getConversations();
        friendMessages.whenConnected.then(() =>
            friendMessages.initialize(conversations, userService.user._id));
    }

    async loadContent() {
        if (this._toggleChoice === "global") {
            const globalConversation = await chatService.getGlobalConversation();
            this._openChatBox(globalConversation);
        } else
            await this._openFriendList();
    }

    _updateFriendMessage(conversationId, message) {
        const friendMessages = this.shadowRoot.querySelector("friend-messages");
        if (!friendMessages)
            return;

        friendMessages.updateFriendMessage(conversationId, message);
    }
}