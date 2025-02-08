import {CustomNav} from "../custom-nav/custom-nav.js";
import {GameBoard} from "../game-board/game-board.js";
import {HomeButton} from "../home-button/home-button.js";
import {GameHeader} from "../game-header/game-header.js";
import {Component} from "../component/component.js";

export class GameComponent extends Component {
    constructor() {
        super();

        HomeButton.register();
        GameBoard.register();
        GameHeader.register();
        CustomNav.register();
    }
}