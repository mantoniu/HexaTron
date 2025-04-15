const http = require('http');
const {Server} = require('socket.io');
const GameEngine = require("./game/GameEngine.js");
const {GAME_END, CREATED} = require("./game/GameStatus");
const RemotePlayer = require("./game/RemotePlayer");
const {GameType} = require("./game/Game");
const {GAME_SETTINGS} = require("./game/Utils");
const {NOTIFICATION_TYPE, sendNotification, deleteNotification} = require("../utils/controller-utils");

const ErrorTypes = Object.freeze({
    GAME_NOT_FOUND: 'GAME_NOT_FOUND',
    PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
    INVALID_INPUT: 'INVALID_INPUT',
    GAME_CREATION_FAILED: 'GAME_CREATION_FAILED',
    ALREADY_IN_GAME: 'ALREADY_IN_GAME',
    GAME_ERROR: "GAME_ERROR",
    ELO_RETRIEVING_ERROR: "ELO_RETRIEVING_ERROR",
    ELO_UPDATING_ERROR: "ELO_UPDATING_ERROR"
});

const server = http.createServer(function (request, response) {
    if (request.url.split("/")[1] === "health") {
        response.writeHead(204);
        response.end();
    }
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const activeGames = new Map(); // { gameEngineId => gameEngine }
const friendlyGames = new Map(); // playerId -> gameEngine
const pendingGames = new Map(); // gameEngineId -> gameEngine
const usersInRankedGames = new Set();

/**
 * Update the player's ELO based on the game results
 *
 * @param gameId - The game id
 * @param results - The results of the game
 * @returns {Promise<void>}
 */
async function updateELO(gameId, results) {
    let K = 40;

    let resultByPlayer = Object.fromEntries([...activeGames.get(gameId).game.players.keys()].map(key => [key, 0]));
    results.forEach(result => {
        if (result.winner)
            return resultByPlayer[result.winner] += 1;
    });

    let newELO = {};

    try {
        let response = await fetch(process.env.USER_SERVICE_URL + "/api/user/ELO", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(Array.from(activeGames.get(gameId).game.players.keys()))
        });

        if (!response.ok) {
            throw {
                type: ErrorTypes.ELO_RETRIEVING_ERROR,
                message: "Error occurred while retrieving the ELO of the players"
            };
        }

        const data = await response.json();
        const [playersELO, sum] = data.playersELO.reduce((acc, player) => {
            acc[0][player._id] = player.elo;
            acc[1] += 10 ** (player.elo / 400);
            return acc;
        }, [{}, 0]);

        let orderedPlayers = Object.entries(resultByPlayer).sort((first, second) => second[1] - first[1]);
        let previous = [orderedPlayers[0]];
        let counter = 1;
        let pos = 1;
        let numberOfPlayers = orderedPlayers.length;

        for (let i = 1; i <= numberOfPlayers; i++) {
            if (i === numberOfPlayers || previous[0][1] !== orderedPlayers[i][1]) {
                const playerScore = (numberOfPlayers - (pos + (counter - 1) / 2)) / (numberOfPlayers - 1);
                previous.forEach(element => newELO[element[0]] = playersELO[element[0]] + K * (playerScore - (10 ** (playersELO[element[0]] / 400)) / sum));

                if (i !== numberOfPlayers) {
                    previous = [orderedPlayers[i]];
                    pos += counter;
                    counter = 1;
                }
            } else {
                previous.push(orderedPlayers[i]);
                counter += 1;
            }
        }

        await Promise.all(Object.entries(newELO).map(async ([id, elo]) => {
            let response = await fetch(process.env.USER_SERVICE_URL + "/api/user/me", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": id
                },
                body: JSON.stringify({elo: elo})
            });
            if (!response.ok) {
                throw {
                    type: ErrorTypes.ELO_UPDATING_ERROR,
                    message: "Error occurred while updating the ELO of the players"
                };
            }
            let result = await response.json();
            io.to(id).emit("updateELO", result.user);
        }));
    } catch (error) {
        io.to(gameId).emit("error", {
            type: error.type,
            message: error.message
        });
    }
}

/**
 * Handle a game event
 *
 * @param {string} gameId - The game id
 * @param {string} eventName - The event name
 * @param {any} eventData - The event data
 */
function handleEvent(gameId, eventName, eventData) {
    if (!activeGames.has(gameId))
        return;

    io.to(gameId).emit(eventName, eventData);

    if (eventName === "refreshStatus" && eventData.status === GAME_END) {
        const gameEngine = activeGames.get(gameId);

        if (!gameEngine)
            return;


        if (activeGames.get(gameId).game.type === GameType.RANKED) {
            gameEngine.game.players.forEach((_, playerId) => {
                usersInRankedGames.delete(playerId);
            });

            updateELO(gameId, eventData.results).then(() => activeGames.delete(gameId));
        } else
            activeGames.delete(gameId);
    }
}

/**
 * Sends an error message to a specific socket.
 *
 * @param {Socket} socket - The socket to which the error should be sent.
 * @param {string} errorType - The type of error.
 * @param {string} message - A descriptive error message.
 */
function sendError(socket, errorType, message) {
    socket.emit("error", {
        type: errorType,
        message: message,
    });
}

/**
 * Validates whether a player can join a game.
 *
 * @param {Array} players - An array of player objects attempting to join the game.
 * @param {string} gameType - The type of game to join (e.g., "FRIENDLY", "COMPETITIVE").
 * @throws {Object} Throws an error if the input data is invalid or if the player is already in a game.
 */
function validateJoin(players, gameType) {
    if (!Array.isArray(players) || players.length === 0 || gameType == null) {
        throw {
            type: ErrorTypes.INVALID_INPUT,
            message: "Invalid data"
        };
    }

    if (gameType !== GameType.RANKED)
        return;

    const isAlreadyInGame = players.some(player => usersInRankedGames.has(player.id));
    if (isAlreadyInGame) {
        throw {
            type: ErrorTypes.ALREADY_IN_GAME,
            message: "This user is already in a game."
        };
    }
}

/**
 * Creates a new game instance with the specified players and game type.
 *
 * @param {Array} players - An array of player objects participating in the game.
 * @param {number} gameType - The type of game to be created.
 * @returns {GameEngine} A new instance of the GameEngine managing the game.
 */
function createNewGame(players, gameType) {
    return new GameEngine(
        players,
        gameType,
        GAME_SETTINGS.ROW_NUMBER,
        GAME_SETTINGS.COL_NUMBER,
        GAME_SETTINGS.ROUNDS_COUNT,
        GAME_SETTINGS.PLAYERS_COUNT,
        (gameId, eventName, eventData) => handleEvent(gameId, eventName, eventData)
    );
}

/**
 * Retrieves a summary of the players in the form of a dictionary
 *
 * @param {Map<string, Object>} players - A Map where the keys are player IDs and the values are player objects.
 * Each object should have at least a `name` and `playerType` property.
 *
 * @returns {Object} - A dictionary where the key is the player ID and the value is an object containing:
 *                     - `_id`: The player ID.
 *                     - `_name`: The player name.
 *                     - `_playerType`: The player type.
 */
function getPlayersSummary(players) {
    const playerSummary = {};
    players.forEach((player, playerId) => {
        playerSummary[playerId] = {
            _id: playerId,
            _name: player.name,
            _playerType: player.playerType
        };
    });
    return playerSummary;
}

/**
 * Starts the game if all required players have joined.
 *
 * @param {GameEngine} gameEngine - The game engine instance managing the game.
 * @returns {boolean} True if the game is ready and has started, false otherwise.
 */
function startGameIfReady(gameEngine) {
    const isReady = gameEngine.game.players.size === gameEngine.playersCount || gameEngine.game.type === GameType.AI;

    if (isReady) {
        if (pendingGames.has(gameEngine.id))
            pendingGames.delete(gameEngine.id);

        io.to(gameEngine.id).emit("refreshStatus", {
            status: CREATED,
            data: {id: gameEngine.id, players: getPlayersSummary(gameEngine.game.players)}
        });

        gameEngine.start().then().catch(({type, _}) => {
            io.to(gameEngine.id).emit("error", {
                type: type || ErrorTypes.GAME_ERROR,
                message: "An error has been encountered during the game.",
            });
        });

        activeGames.set(gameEngine.id, gameEngine);

        if (gameEngine.game.type === GameType.RANKED) {
            for (const playerId of gameEngine.game.players.keys())
                usersInRankedGames.add(playerId);
        }
    } else if (gameEngine.game.type !== GameType.FRIENDLY && !pendingGames.has(gameEngine.id))
        pendingGames.set(gameEngine.id, gameEngine);

    return isReady;
}

/**
 * Creates a new friendly game and sends an invitation to the expected opponent to join the game.
 *
 * @param {RemotePlayer} player - The player creating the friendly game.
 * @param {string} expectedPlayerId - The ID of the expected opponent to whom the invitation will be sent.
 * @param {Socket} socket - The socket instance of the player, used to join the new game room.
 * @param {function(string): void} callback - Callback function that receives the newly created game ID.
 * @returns {void}
 */
function createFriendlyGame(player, expectedPlayerId, socket, callback) {
    const game = createNewGame([player], GameType.FRIENDLY);
    socket.join(game.id);
    friendlyGames.set(game.id, game);
    callback(game.id);

    sendNotification(expectedPlayerId,
        NOTIFICATION_TYPE.GAME_INVITATION,
        player.id,
        [game.id]).catch(error => console.error(`Error while sending game invitation:`, error));
}

/**
 * Allows a player to join an existing friendly game by its ID and starts the game if ready.
 *
 * @param {RemotePlayer} player - The player attempting to join the friendly game.
 * @param {string} gameId - The ID of the friendly game the player is trying to join.
 * @param {Socket} socket - The socket instance of the player, used to join the game room.
 */
function joinFriendlyGame(player, gameId, socket) {
    if (!friendlyGames.has(gameId))
        return;

    const game = friendlyGames.get(gameId);
    game.addPlayer(player);
    socket.join(gameId);

    if (startGameIfReady(game))
        friendlyGames.delete(gameId);
}

/**
 * Returns the first game room from a player's list of rooms
 * that matches a pending, active, or friendly game.
 *
 * @param {Set<string>} rooms - The set of room IDs the player is in.
 * @returns {string | undefined} - The game ID if found, otherwise undefined.
 */
function getPlayerGame(rooms) {
    return Array.from(rooms).find(room =>
        pendingGames.has(room) ||
        activeGames.has(room) ||
        friendlyGames.has(room)
    );
}

/**
 * If the game exists in the given map and has only one player,
 * deletes it from the map. In all cases, removes the socket from the room.
 *
 * @param {Map<string, GameEngine>} map - The map of games (pending or friendly).
 * @param {string} gameId - The ID of the game to leave.
 * @param {Socket} socket - The player's socket instance.
 *
 * @returns {boolean} - True if the game existed and the player was removed, false otherwise.
 */
function deleteIfSinglePlayerGame(map, gameId, socket) {
    if (map.has(gameId)) {
        const gameEngine = map.get(gameId);
        if (gameEngine.game.players.size === 1)
            map.delete(gameId);

        socket.leave(gameId);
        return true;
    }

    return false;
}

/**
 * Handles the event when a player leaves a game.
 * It handles both pending and active games, removing the player from the game
 * and cleaning up if necessary.
 *
 * @param {string} gameId - The ID of the game the player is leaving.
 * @param {string} userId - The ID of the player who is leaving the game.
 * @param {Socket} socket - The socket instance of the player.
 *
 * @returns {void}
 */
function handlePlayerLeave(gameId, userId, socket) {
    if (deleteIfSinglePlayerGame(pendingGames, gameId, socket))
        return;

    if (deleteIfSinglePlayerGame(friendlyGames, gameId, socket)) {
        deleteNotification(userId, gameId).catch(error =>
            console.error("Notification deletion failed:", error));
        return;
    }

    if (!activeGames.has(gameId))
        return;

    const gameEngine = activeGames.get(gameId);
    socket.leave(gameId);
    if (gameEngine.game.type !== GameType.RANKED
        && gameEngine.game.type !== GameType.FRIENDLY) {
        activeGames.delete(gameId);
        return;
    }

    gameEngine.disconnectPlayer(userId);
}

io.on('connection', (gatewaySocket) => {
    console.log('✅ Gateway socket connected to the Game Service');

    const userId = gatewaySocket.handshake.auth.userId;
    if (userId)
        gatewaySocket.join(userId);

    gatewaySocket.on("joinGame", (gameParams, callback) => {
        try {
            const {players, gameType, params} = gameParams;
            validateJoin(players, gameType);

            const remotePlayers = [];

            players.forEach(player => {
                remotePlayers.push(new RemotePlayer(player.id, player.name));
            });

            if (gameType === GameType.FRIENDLY) {
                if (params.friendId) {
                    createFriendlyGame(remotePlayers[0], params.friendId, gatewaySocket, callback);
                    return;
                }

                if (params.gameId) {
                    joinFriendlyGame(remotePlayers[0], params.gameId, gatewaySocket);
                    return;
                }
            }

            let game = Array.from(pendingGames.values()).find(gameEngine =>
                gameEngine.game.type === gameType &&
                gameEngine.game.players.size + remotePlayers.length <= gameEngine.playersCount
            );

            if (game)
                remotePlayers.forEach(player => game.addPlayer(player));
            else game = createNewGame(remotePlayers, gameType);

            gatewaySocket.join(game.id);

            if (callback)
                callback(game.id);

            startGameIfReady(game);
        } catch ({type, message}) {
            sendError(
                gatewaySocket,
                type || ErrorTypes.GAME_CREATION_FAILED,
                message
            );
        }
    });

    gatewaySocket.on("nextMove", (data) => {
        const {gameId, playerId, move} = data;

        if (!gameId || !playerId || move === undefined) {
            sendError(gatewaySocket, ErrorTypes.INVALID_INPUT, "Missing required move parameters");
            return;
        }

        if (!activeGames.has(gameId))
            return;

        const gameEngine = activeGames.get(gameId);

        const player = gameEngine.game.players.get(playerId);
        if (!player) {
            sendError(gatewaySocket, ErrorTypes.PLAYER_NOT_FOUND, "Player not found");
            return;
        }

        player.resolveMove(move);
    });

    gatewaySocket.on("leaveGame", (gameId) => {
        handlePlayerLeave(gameId, userId, gatewaySocket);
    });

    gatewaySocket.on("disconnecting", () => {
        const gameId = getPlayerGame(gatewaySocket.rooms);
        if (gameId)
            handlePlayerLeave(gameId, userId, gatewaySocket);
    });
});

server.listen(8002, () => {
    console.log(`🎮 Game Service WebSocket listening on ${process.env.GAME_SERVICE_URL}`);
});
