import {GameBoard} from "../game-board/game-board.js";
import {GameHeader} from "../game-header/game-header.js";
import {Component} from "../component/component.js";

export class GameComponent extends Component {
    constructor() {
        super();

        GameBoard.register();
        GameHeader.register();
    }
}