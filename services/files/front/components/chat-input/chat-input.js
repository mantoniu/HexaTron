import {Component} from "../component/component.js";

export class ChatInput extends Component {
    async connectedCallback() {
        await super.connectedCallback();

        const input = this.shadowRoot.getElementById("message-input");
        const sendButton = this.shadowRoot.getElementById("send-button");

        const sendMessage = () => {
            const message = input.value.trim();
            if (message) {
                this.dispatchEvent(new CustomEvent("new-message", {
                    detail: {message}
                }));
                input.value = "";
            }
        };

        sendButton.addEventListener("click", sendMessage);
        input.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage();
            }
        });
    }
}
