import { CustomNav } from "../custom-nav/custom-nav.js";
import { GameBoard } from "../game-board/game-board.js";
import { HomeButton } from "../home-button/home-button.js";
import { GameHeader } from "../game-header/game-header.js";

function onLoad() {
    document.addEventListener("game-created", (event) => {
        const gameHeader = document.querySelector("game-header");
        if (gameHeader)
            gameHeader.receiveData(event.detail.players, gameHeader).then();
    });
}

HomeButton.register();
GameBoard.register();
GameHeader.register();
CustomNav.register();
window.onLoad = onLoad;