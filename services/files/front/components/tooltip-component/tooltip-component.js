import {Component} from "../component/component.js";
import {POSITION} from "./tooltip-positions.js";

/**
 * HTML attributes usable on this component:
 * - default-activated: boolean - Whether the tooltip is always activated or only on hover
 * - message: string - The message displayed inside the tooltip
 * - space: number - The space between the tooltip and the target element
 * - position: string - One of the positions defined in tooltip-position.js
 * - width: number - The width of the component
 * - height: number - The height of the component
 * - wrap: string - The wrap attribute applied to the tooltip's text
 * - arrow: boolean - Whether an arrow is displayed or not
 */
export class TooltipComponent extends Component {
    async connectedCallback() {
        await super.connectedCallback();
        this._tooltip = this.shadowRoot.getElementById("tooltip");
        this.update();
    }

    update() {
        const activated = JSON.parse(this.getAttribute("default-activated"));
        if (!activated) {
            this.hideTooltip();
        }

        const message = this.getAttribute("message");
        if (message === "null") {
            this.style.display = "none";
            return;
        } else
            this._tooltip.innerText = message;

        const arrow = this.getAttribute("arrow");
        if (!arrow || arrow === "false") {
            this._tooltip.style.setProperty("--tooltip-arrow-content", "none");
        } else
            this._tooltip.style.setProperty("--tooltip-arrow-content", "");

        const wrap = this.getAttribute("wrap");
        if (!wrap) {
            this._tooltip.style.whiteSpace = "nowrap";
        } else
            this._tooltip.style.whiteSpace = wrap;

        this._tooltip.style.height = this.getAttribute("height") || "fit-content";
        this._tooltip.style.width = this.getAttribute("width") || "fit-content";

        this.updatePosition();
    }

    updatePosition() {
        let target;
        if (this.assignedSlot) {
            target = this.parentNode;
        } else
            target = this.previousElementSibling;
        if (!target) {
            return;
        }

        if (!JSON.parse(this.getAttribute("default-activated"))) {
            this.addAutoCleanListener(target, "mouseenter", this.showTooltip.bind(this));
            this.addAutoCleanListener(target, "mouseleave", this.hideTooltip.bind(this));
        }

        const spacing = JSON.parse(this.getAttribute("space")) || 8;

        this._tooltip.style.top = "";
        this._tooltip.style.left = "";
        this._tooltip.style.right = "";
        this._tooltip.style.bottom = "";

        const position = this.getAttribute("position") || "top";
        const data = POSITION[position];
        Array.from(this.shadowRoot.styleSheets[0].cssRules).forEach((rule, index) => {
            if (data.hasOwnProperty(rule.selectorText)) {
                let text = rule.cssText.slice(0, -2);
                Object.entries(data[rule.selectorText]).forEach(([key, value]) => {
                    text = text.concat(key);
                    text += ":";
                    const res = value(spacing);
                    text = text.concat(res);
                    text += ";";
                });
                text += " }";
                this.shadowRoot.styleSheets[0].deleteRule(index);
                this.shadowRoot.styleSheets[0].insertRule(text, index);
            }
        });
    }

    showTooltip() {
        this._tooltip.style.opacity = 1;
        this._tooltip.style.visibility = "visible";
    }

    hideTooltip() {
        this._tooltip.style.opacity = 0;
        this._tooltip.style.visibility = "hidden";
    }
}