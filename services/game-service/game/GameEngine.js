const {GameType, Game} = require("./Game.js");
const createPlayer = require("./PlayerFactory.js");
const RemotePlayer = require("./RemotePlayer.js");
const {defaultMovementsMapping, Directions, MovementTypes, DISPLACEMENT_FUNCTIONS} = require("./GameUtils.js");
const PlayerState = require("./PlayerState.js");

class GameEngine {
    constructor(users, gameType, rowNumber, columnNumber, roundsCount, playersCount, eventHandler, choiceTimeout = 250, setupTimeout = 1000) {
        this._eventHandler = eventHandler;
        this._id = crypto.randomUUID();
        this._playersCount = playersCount;
        this._choiceTimeout = choiceTimeout;
        this._setupTimeout = setupTimeout;
        this._remainingPlayers = {};
        this._disconnectedPlayers = new Set();

        switch (gameType) {
            case GameType.LOCAL:
            case GameType.AI:
                this.initGame(users, gameType, playersCount, rowNumber, columnNumber, roundsCount);
                break;
            default:
                throw new Error(`The ${gameType} game type is not yet supported.`);
        }
    }

    get id() {
        return this._id;
    }

    get playersCount() {
        return this._playersCount;
    }

    get game() {
        return this._game;
    }

    initGame(users, gameType, playersCount, rowNumber, columnNumber, roundsCount) {
        let players = Object.fromEntries(users.map(user => [user.id, new RemotePlayer(user.id, user.name, user.socketId)]));

        for (let i = users.length; i < playersCount; i++) {
            players[`${i}`] = createPlayer(
                gameType,
                `${i}`,
                user.parameters.playersColors[i],
                gameType === GameType.LOCAL ? user.parameters.keys[i] : null
            );
        }

        this._game = new Game(gameType, rowNumber, columnNumber, players, roundsCount);
    }

    remapMovements(playerId, diff) {
        for (const [inputKey, directionValue] of Object.entries(this._playersMovements[playerId]))
            this._playersMovements[playerId][inputKey] = (directionValue + diff + 6) % 6;
    }

    initializePlayersDirections() {
        this._playersMovements = {};

        for (const playerId of Object.keys(this._remainingPlayers)) {
            this._playersMovements[playerId] = {...defaultMovementsMapping};

            const playerColumn = Number(this._game.getPlayerPosition(playerId).column);
            const defaultDirection = playerColumn === 1
                ? Directions.RIGHT
                : Directions.LEFT;

            const rotationDiff = Directions.RIGHT - defaultDirection;

            this.remapMovements(playerId, rotationDiff);
        }
    }

    async wrapWithTimeout(methodCall, timeout, defaultValue) {
        const resultPromise = Promise.race([
            methodCall,
            new Promise(resolve =>
                setTimeout(() => resolve(defaultValue), timeout)
            )
        ]);

        const minDelayPromise = new Promise(resolve =>
            setTimeout(resolve, timeout)
        );

        const [result] = await Promise.all([resultPromise, minDelayPromise]);

        return result;
    }

    async initialize() {
        this._game.setPlayersStartPositions();

        this.emitGameUpdate({
            status: "newPositions",
            data: {newPositions: this.game.playersPositions}
        });

        this._remainingPlayers = {...this._game.players};

        this.initializePlayersDirections();

        const setupPromises = [];
        for (const player of Object.values(this._remainingPlayers)) {
            const playerPosition = this._game.getPlayerPosition(player.id);
            const setupPromise = this.wrapWithTimeout(
                player.setup(this.getPlayerState(player)),
                this._setupTimeout,
                undefined,
                `Setup timeout for player ${player.id}: `
            );

            setupPromises.push(setupPromise.then(() => {
                this._game.setPlayerPosition(player.id, playerPosition);
            }));
        }

        await Promise.all(setupPromises);
    }

    getPlayerState(player) {
        let playerPosition = this._game.getPlayerPosition(player.id);
        let opponentPosition = Object.keys(this._remainingPlayers)
            .filter(playerId => playerId !== player.id)
            .map(playerId => this._game.getPlayerPosition(playerId))[0];

        return new PlayerState(playerPosition, opponentPosition);
    }

    updateDirectionMapping(playerId, direction) {
        const newDirection = this._playersMovements[playerId][direction];
        const diff = newDirection - this._playersMovements[playerId][MovementTypes.KEEP_GOING];

        this.remapMovements(playerId, diff);
    }

    async computeNewPositions() {
        const movePromises = Object.values(this._remainingPlayers).map(player =>
            this.wrapWithTimeout(
                player.nextMove(this.getPlayerState(player)),
                this._choiceTimeout,
                MovementTypes.KEEP_GOING,
                `Move timeout for player ${player.id}: `
            )
        );

        const movements = await Promise.all(movePromises);
        const newPositions = {};

        movements.forEach((movement, i) => {
            const player = Object.values(this._remainingPlayers)[i];
            const direction = this._playersMovements[player.id][movement];

            this.updateDirectionMapping(player.id, movement);

            const pos = DISPLACEMENT_FUNCTIONS[direction](
                this._game.getPlayerPosition(player.id)
            );

            if (this._game.board.checkPositionValidity(pos))
                newPositions[player.id] = pos;
        });

        return newPositions;
    }

    identifyTies(positions) {
        if (!Object.keys(positions).length) {
            const remainingPlayers = [Object.keys(this._remainingPlayers)];
            this._remainingPlayers = {};
            return remainingPlayers;
        }

        let ties = new Map();
        let involvedPlayers = new Set();

        const playerIds = Object.keys(positions);
        for (let i = 0; i < playerIds.length; i++) {
            for (let j = i + 1; j < playerIds.length; j++) {
                const playerId1 = playerIds[i];
                const playerId2 = playerIds[j];
                const posKey = JSON.stringify(positions[playerId1]);

                if (positions[playerId1].equals(positions[playerId2])) {
                    if (!ties.has(posKey))
                        ties.set(posKey, new Set([playerId1, playerId2]));
                    else
                        ties.get(posKey).add(playerId2);

                    involvedPlayers.add(playerId1);
                    involvedPlayers.add(playerId2);
                }
            }
        }

        this._remainingPlayers = Object.fromEntries(playerIds.filter(playerId => !involvedPlayers.has(playerId))
            .map(id => [id, this._game.getPlayer(id)]));

        return [...ties.values()].map(set => [...set]);
    }

    disconnectPlayer(playerId) {
        this._disconnectedPlayers.add(playerId);
        return this.endGame();
    }

    endGame() {
        return this._disconnectedPlayers.size === Object.keys(this.game.players).length;
    }

    async start() {
        for (let round = 0; (round < this._game.roundsCount) && !this.endGame(); round++) {
            const result = await this.runRound();
            this.emitGameUpdate({status: "roundEnd", data: result});
            this._game.resetBoard(this._canvas);
        }
        this.emitGameUpdate({status: "end"});
    }

    async runRound() {
        await this.initialize();

        while (true) {
            const validPositions = await this.computeNewPositions();
            const ties = this.identifyTies(validPositions);
            const remainingIds = Object.keys(this._remainingPlayers);

            if (!remainingIds.length)
                return {status: "tie", ties};

            for (const player of Object.values(this._remainingPlayers)) {
                const newPos = validPositions[player.id];

                this._game.setPlayerPosition(player.id, newPos);
            }

            this.emitGameUpdate({
                status: "newPositions",
                data: {newPositions: this.game.playersPositions}
            });

            if (remainingIds.length === 1) {
                return {status: "winner", winner: remainingIds[0]};
            }
        }
    }

    emitGameUpdate(data) {
        this._eventHandler(this.id, "refreshStatus", data);
    }
}

module.exports = GameEngine;