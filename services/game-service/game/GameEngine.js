const {GameType, Game} = require("./Game");
const {
    defaultMovementsMapping, absoluteDisplacementToPosition, DISPLACEMENT_TYPES, RELATIVE_DISPLACEMENTS,
    ABSOLUTE_DISPLACEMENTS
} = require("./GameUtils");
const PlayerState = require("./PlayerState");
const {PlayerType} = require("./Player");
const {ROUND_END, POSITIONS_UPDATED, GAME_END} = require("./GameStatus");
const MiniMaxAI = require("./ai/MiniMaxAI");
const crypto = require("crypto");

/**
 * @class GameEngine
 * @classdesc Handles the game logic, including player movements, round management, and event handling.
 */
class GameEngine {
    /**
     * Creates an instance of GameEngine.
     * @param {Array<Player>} players - List of players.
     * @param {number} gameType - The type of game.
     * @param {number} rowNumber - Number of rows in the board.
     * @param {number} columnNumber - Number of columns in the board.
     * @param {number} roundsCount - Total number of rounds.
     * @param {number} playersCount - Total number of players.
     * @param {Function} eventHandler - Function to handle game events.
     * @param {number} [choiceTimeout=250] - Timeout for player choices.
     * @param {number} [setupTimeout=1000] - Timeout for player setup.
     */
    constructor(players, gameType, rowNumber, columnNumber, roundsCount, playersCount, eventHandler, choiceTimeout = 250, setupTimeout = 1000) {
        this._eventHandler = eventHandler;
        this._id = crypto.randomUUID();
        this._playersCount = playersCount;
        this._choiceTimeout = choiceTimeout;
        this._setupTimeout = setupTimeout;
        this._remainingPlayers = {};
        this._disconnectedPlayers = new Set();

        if (!Object.values(GameType).includes(gameType) || GameType === GameType.FRIENDLY)
            throw new Error(`The game type ${gameType} is not yet supported`);

        this.initGame(players, gameType, playersCount, rowNumber, columnNumber, roundsCount);
    }

    /**
     * Gets the game engine ID.
     *
     * @returns {string} Game ID.
     */
    get id() {
        return this._id;
    }

    /**
     * Gets the total number of players.
     *
     * @returns {number} Number of players.
     */
    get playersCount() {
        return this._playersCount;
    }

    /**
     * Gets the game instance.
     *
     * @returns {Game} The game instance.
     */
    get game() {
        return this._game;
    }

    /**
     * Initializes the game.
     *
     * @param {Array<Player>} players - The players.
     * @param {number} gameType - The game type.
     * @param {number} playersCount - The number of players.
     * @param {number} rowNumber - Number of rows.
     * @param {number} columnNumber - Number of columns.
     * @param {number} roundsCount - Number of rounds.
     */
    initGame(players, gameType, playersCount, rowNumber, columnNumber, roundsCount) {
        if (players.length > playersCount)
            throw new Error(`Too many users for this game. Maximum allowed: ${playersCount}, received: ${players.length}`);

        /** @type {Map<string, Player>} */
        let mappedPlayers = new Map(players.map(player => [player.id, player]));

        if (gameType === GameType.AI) {
            for (let i = players.length; i < playersCount; i++) {
                let id = crypto.randomUUID();
                mappedPlayers.set(id, new MiniMaxAI(id, `MinMaxAI ${i}`));
            }
        }

        this._game = new Game(gameType, rowNumber, columnNumber, mappedPlayers, roundsCount);
    }

    /**
     * Remaps player movement keys.
     *
     * @param {string} playerId - The player ID.
     * @param {number} diff - The direction difference.
     */
    remapMovements(playerId, diff) {
        for (const [inputKey, directionValue] of Object.entries(this._playersMovements[playerId]))
            this._playersMovements[playerId][inputKey] = (directionValue + diff + 6) % 6;
    }

    /**
     * Initializes the player directions.
     */
    initializePlayersDirections() {
        this._playersMovements = {};

        for (const playerId of Object.keys(this._remainingPlayers)) {
            this._playersMovements[playerId] = {...defaultMovementsMapping};

            const playerColumn = Number(this._game.getPlayerPosition(playerId).column);
            const defaultDirection = playerColumn === 1
                ? ABSOLUTE_DISPLACEMENTS.RIGHT
                : ABSOLUTE_DISPLACEMENTS.LEFT;

            const rotationDiff = ABSOLUTE_DISPLACEMENTS.RIGHT - defaultDirection;

            this.remapMovements(playerId, rotationDiff);
        }
    }

    /**
     * Wraps a function call with a timeout.
     *
     * @param {Promise} methodCall - The method to execute.
     * @param {number} timeout - The timeout duration.
     * @param {*} defaultValue - The default value on timeout.
     * @returns {Promise<*>} The result of the function call or the default value.
     */
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

    /**
     * Initializes the game and players.
     *
     * @returns {Promise<void>}
     */
    async initialize() {
        this._game.setPlayersStartPositions();

        this.emitGameUpdate({
            status: POSITIONS_UPDATED,
            data: {newPositions: this.game.playersPositions}
        });

        this._remainingPlayers = Object.fromEntries(this._game.players);

        this.initializePlayersDirections();

        const setupPromises = [];
        for (const player of Object.values(this._remainingPlayers)) {
            const playerPosition = this._game.getPlayerPosition(player.id);
            const setupPromise = this.wrapWithTimeout(
                player.setup(this.getPlayerState(player)),
                this._setupTimeout,
                undefined
            );

            setupPromises.push(setupPromise.then(() => {
                this._game.setPlayerPosition(player.id, playerPosition);
            }));
        }

        await Promise.all(setupPromises);
    }

    /**
     * Gets the state of a player.
     *
     * @param {Object} player - The player object.
     * @returns {PlayerState} The player's state.
     */
    getPlayerState(player) {
        let playerPosition = this._game.getPlayerPosition(player.id);
        let opponentPosition = Object.keys(this._remainingPlayers)
            .filter(playerId => playerId !== player.id)
            .map(playerId => this._game.getPlayerPosition(playerId))[0];

        return new PlayerState(playerPosition, opponentPosition);
    }

    /**
     * Updates the movement mapping for a player.
     *
     * @param {string} playerId - The player ID.
     * @param {string} newDirection - The movement direction.
     */
    updateDirectionMapping(playerId, newDirection) {
        const diff = newDirection - this._playersMovements[playerId][RELATIVE_DISPLACEMENTS.KEEP_GOING];

        this.remapMovements(playerId, diff);
    }

    /**
     * Computes new positions for the players.
     *
     * @returns {Promise<Object>} The new positions.
     */
    async computeNewPositions() {
        const movePromises = Object.values(this._remainingPlayers).map(player =>
            this.wrapWithTimeout(
                player.nextDisplacement(this.getPlayerState(player)),
                this._choiceTimeout,
                {
                    type: DISPLACEMENT_TYPES.RELATIVE,
                    value: RELATIVE_DISPLACEMENTS.KEEP_GOING
                }
            )
        );

        const displacements = await Promise.all(movePromises);
        const newPositions = {};

        displacements.forEach((displacement, i) => {
            const player = Object.values(this._remainingPlayers)[i];
            let direction;

            if (displacement.type === DISPLACEMENT_TYPES.ABSOLUTE) {
                direction = displacement.value;
                this._playersMovements[player.id][RELATIVE_DISPLACEMENTS.KEEP_GOING] = direction;
            } else {
                const movement = displacement.value;
                direction = this._playersMovements[player.id][movement];
                this.updateDirectionMapping(player.id, direction);
            }

            const pos = absoluteDisplacementToPosition[direction](
                this._game.getPlayerPosition(player.id)
            );

            if (this._game.board.checkPositionValidity(pos))
                newPositions[player.id] = pos;
        });

        return newPositions;
    }

    /**
     * Identifies ties among players.
     *
     * @param {Object} positions - The positions of players.
     * @returns {Array<Array<string>>} Groups of tied players.
     */
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

    /**
     * Handles player disconnection.
     *
     * @param {string} playerId - The player ID.
     * @returns {boolean} Whether the game is empty.
     */
    disconnectPlayer(playerId) {
        this._disconnectedPlayers.add(playerId);
        return this.isGameEmpty();
    }

    /**
     * Checks if the game has no active players.
     *
     * @returns {boolean} Whether the game is empty.
     */
    isGameEmpty() {
        const nonAIPlayers = Array.from(this.game.players.values())
            .filter(player => player.playerType !== PlayerType.AI);

        return this._disconnectedPlayers.size === nonAIPlayers.length;
    }

    /**
     * Waits for a specified delay.
     *
     * @param {number} [delay=5000] - The delay in milliseconds.
     * @returns {Promise<void>}
     */
    async wait(delay = 5000) {
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Starts the game loop.
     *
     * @returns {Promise<void>}
     */
    async start() {
        let results = [];
        await this.wait(1000);
        for (let round = 0; (round < this._game.roundsCount) && !this.isGameEmpty(); round++) {
            const result = await this.runRound();
            this.emitGameUpdate({
                status: ROUND_END, data: {
                    ...result,
                    round: round
                }
            });
            results.push(result);
            this._game.resetBoard();
        }

        const missingRounds = this._game.roundsCount - results.length;
        if (missingRounds > 0) {
            const playerIds = Array.from(this.game.players.keys());
            for (let i = 0; i < missingRounds; i++)
                results.push({status: "tie", ties: [playerIds]});
        }

        this.emitGameUpdate({status: GAME_END, results: results});
    }

    /**
     * Adds a player to the game.
     *
     * @param {Player} player - The player object.
     */
    addPlayer(player) {
        this.game.players.set(player.id, player);
    }

    /**
     * Runs a single round of the game.
     *
     * @returns {Promise<Object>} The result of the round.
     */
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
                status: POSITIONS_UPDATED,
                data: {newPositions: this.game.playersPositions}
            });

            if (remainingIds.length === 1) {
                return {status: "winner", winner: remainingIds[0]};
            }
        }
    }

    /**
     * Emits a game update event.
     *
     * @param {Object} data - The event data.
     */
    emitGameUpdate(data) {
        this._eventHandler(this.id, "refreshStatus", data);
    }
}

module.exports = GameEngine;