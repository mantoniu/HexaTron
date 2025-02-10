import {Component} from "../component/component.js";

export class FormInput extends Component {
    constructor() {
        super();

        this.placeholder = "";
        this.errorMessage = "";
        this.error = false;
        this.required = false;
    }

    static get observedAttributes() {
        return ['id', 'label', 'type', 'placeholder', 'required', 'error-message', 'error', 'max-length', 'maxlength', 'value'];
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.update();

        this.setupListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case "id":
                if (oldValue !== newValue)
                    this.id = newValue;
                break;
            case "label":
                this.label = newValue;
                break;
            case "value":
                this.value = newValue;
                break;
            case "type":
                this.type = newValue;
                break;
            case "placeholder":
                this.placeholder = newValue;
                break;
            case "required":
                this.required = newValue !== null && newValue !== "false";
                break;
            case "error-message":
                this.errorMessage = newValue;
                break;
            case "error":
                this.error = newValue === "true";
                break;
            case "maxlength":
                this.maxLength = parseInt(newValue, 10) || null;
                break;
        }
        if (this.type && this.id)
            this.update();
    }

    update() {
        if (!this.type || !this.id) {
            return;
        }

        const labelElement = this.shadowRoot.querySelector('label');
        this.inputElement = this.shadowRoot.querySelector('input');
        this.errorElement = this.shadowRoot.querySelector('.error-message');

        if (labelElement) {
            labelElement.setAttribute('for', this.id);
            labelElement.textContent = this.label;
        }

        if (this.inputElement) {
            this.inputElement.setAttribute('type', this.type);
            this.inputElement.setAttribute('id', this.id);
            this.inputElement.setAttribute('placeholder', this.placeholder);

            if (this.maxLength) {
                this.inputElement.setAttribute('maxlength', this.maxLength);
            } else {
                this.inputElement.removeAttribute('maxlength');
            }

            if (this.required) {
                this.inputElement.setAttribute('required', '');
            } else {
                this.inputElement.removeAttribute('required');
            }

            if (this.error) {
                this.inputElement.classList.add('error');
            } else {
                this.inputElement.classList.remove('error');
            }

            if (this.value) {
                this.inputElement.setAttribute('value', this.value);
            } else {
                this.inputElement.removeAttribute('value');
            }
        }

        if (this.errorElement) {
            this.errorElement.textContent = this.errorMessage;
            if (this.error && this.errorMessage) {
                this.errorElement.innerText = this.errorMessage;
                this.errorElement.classList.add('visible');
            } else {
                this.errorElement.classList.remove('visible');
            }
        }
    }

    setupListeners() {
        this.setupInputListener();
        this.setupSubmitListener();
    }

    setupInputListener() {
        const charCounter = this.shadowRoot.querySelector('.char-counter');

        this.addAutoCleanListener(this.shadowRoot.querySelector('input'), "input", (e) => {
            this.dismissError();

            if (this.maxLength && charCounter && e.target.value.length !== 0) {
                const remainingChars = this.maxLength - e.target.value.length;
                charCounter.textContent = `${remainingChars} character${(remainingChars > 1) ? "s" : ""} remaining`;
            } else {
                charCounter.textContent = ``;
            }
        });
    }

    setupSubmitListener() {
        this.addAutoCleanListener(this.inputElement, "keydown", (event) => {
            if (event.key === 'Enter') {
                console.log("Enter key pressed. Requesting form submission...");

                this.closest('form')?.dispatchEvent(new Event('submit'));
            }
        });
    }

    dismissError() {
        if (this.inputElement)
            this.inputElement.classList.remove("error");
        if (this.errorMessage)
            this.errorElement.classList.remove("visible");
    }
}