import {Player} from "./Player.js";
import {defaultMovementsConfiguration} from "./GameUtils.js";
import {gameService} from "../../services/game-service.js";

export class LocalPlayer extends Player {
    constructor(id, name, keyConfiguration) {
        super(id, name);
        this._keys = keyConfiguration;
        this._movementsMapping = defaultMovementsConfiguration(keyConfiguration);
        this._currentResolve = null;

        this.setupListener();
    }

    setupListener() {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            if (this._keys.includes(key) && gameService.game?.id) {
                const move = this._movementsMapping[key];
                gameService.nextMove(this.id, move);
            }
        });
    }
}