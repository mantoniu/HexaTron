import {Component} from "../component/component.js";
import {AbsoluteDisplacement} from "../../js/game/AbsoluteDisplacement.js";
import {ABSOLUTE_DISPLACEMENTS} from "../../js/game/GameUtils.js";

export class GameJoystick extends Component {
    async connectedCallback() {
        await super.connectedCallback();

        this._position = this.getAttribute("position");
        this.joyStickHandle = this.shadowRoot.querySelector(".joystick-handle");
        this._handleJoystickStart = this._handleJoystickStart.bind(this);
        this._handleJoystickMove = this._handleJoystickMove.bind(this);
        this._handleJoystickEnd = this._handleJoystickEnd.bind(this);

        this.addEventListener("touchstart", this._handleJoystickStart, {passive: false});
    }

    _handleJoystickStart(event) {
        const touch = event.changedTouches[0];
        event.preventDefault();

        this._center = this.getBoundingClientRect();
        this._radius = this._center.width / 2;
        this._touchId = touch.identifier;

        document.addEventListener("touchmove", this._handleJoystickMove, {passive: false});
        document.addEventListener("touchend", this._handleJoystickEnd, {passive: false});
    }

    _handleJoystickMove(event) {
        const touch = Array.from(event.touches).find(t => t.identifier === this._touchId);
        if (!touch) return;

        const screenWidth = window.innerWidth;
        if ((this._position === "left" && touch.clientX > screenWidth / 2) ||
            (this._position === "right" && touch.clientX < screenWidth / 2)) {
            this._handleJoystickEnd(event);
            return;
        }

        const dx = touch.clientX - (this._center.left + this._radius);
        const dy = touch.clientY - (this._center.top + this._radius);

        const distance = Math.min(Math.sqrt(dx * dx + dy * dy), this._radius);

        if (distance < 30)
            return;

        const angle = Math.atan2(dy, dx);

        const x = distance * Math.cos(angle);
        const y = distance * Math.sin(angle);

        this.joyStickHandle.style.transform = `translate(${x}px, ${y}px)`;

        this._emitNewDirection(angle * 180 / Math.PI);
    }

    _emitNewDirection(angle) {
        let direction;

        if (angle > -30 && angle < 30)
            direction = ABSOLUTE_DISPLACEMENTS.RIGHT;
        else if (angle > -90 && angle < -30)
            direction = ABSOLUTE_DISPLACEMENTS.UPPER_RIGHT;
        else if (angle < -90 && angle > -150)
            direction = ABSOLUTE_DISPLACEMENTS.UPPER_LEFT;
        else if (angle < -150 || angle > 150)
            direction = ABSOLUTE_DISPLACEMENTS.LEFT;
        else if (angle < 150 && angle > 90)
            direction = ABSOLUTE_DISPLACEMENTS.LOWER_LEFT;
        else if (angle > 0 && angle < 90)
            direction = ABSOLUTE_DISPLACEMENTS.LOWER_RIGHT;

        if (direction == null)
            return;
        //TODO add _ convention on every private fields
        this._lastDirection = direction;
        this.dispatchEvent(new CustomEvent("joystickMove", {
            detail: new AbsoluteDisplacement(direction)
        }));
    }

    _handleJoystickEnd(event) {
        const touch = Array.from(event.changedTouches).find(t => t.identifier === this._touchId);
        if (!touch)
            return;

        this.joyStickHandle.style.transform = `translate(0px, 0px)`;
        this._touchId = null;

        document.removeEventListener("touchmove", this._handleJoystickMove);
        document.removeEventListener("touchend", this._handleJoystickEnd);
    }
}
