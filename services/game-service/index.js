const http = require('http');
const {Server} = require('socket.io');
const GameEngine = require("./game/GameEngine.js");
const Player = require("./game/Player");

const server = http.createServer();

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:8000"],
        methods: ["GET", "POST"]
    }
});

const activeGames = new Map(); // { gameId => { game: GameEngine, players: Set<socketId> } }
const socketGameId = new Map(); // socketId -> gameId

function handleEvent(gatewaySocket, gameId, eventName, eventData) {
    console.log(gameId, eventName, eventData);
    if (!activeGames.has(gameId))
        return;

    gatewaySocket.emit(eventName, {
        eventData,
        room: Array.from(activeGames.get(gameId).room)
    });

    if (eventName === "refreshStatus" && eventData.status === "end")
        activeGames.delete(gameId);
}

io.on('connection', (gatewaySocket) => {
    console.log('✅ Gateway connected to the Game Service');

    gatewaySocket.on('disconnect', () => {
        console.log('❌ Gateway disconnected');
    });

    gatewaySocket.on('leaveGame', (socketId) => {
        const gameId = socketGameId.get(socketId);
        const game = activeGames.get(gameId)?.game;

        if (!game)
            return;

        const leavingPlayers = Object.values(game.game.players)
            .filter(player => player.socketId === socketId);

        const gameEnd = leavingPlayers.reduce(
            (gameEnd, player) => gameEnd || game.disconnectPlayer(player.id), false
        );

        if (gameEnd)
            activeGames.delete(gameId);
    });

    gatewaySocket.on("start", (data) => {
        const {gameType, rowNumber, columnNumber, roundsCount, playersCount, users} = data.args[0];
        //TODO check if the data is correct
        const players = users.map(user => new Player(user.id, user.name, data.socketId));

        const newGame = new GameEngine(
            players,
            gameType,
            rowNumber,
            columnNumber,
            roundsCount,
            playersCount,
            (gameId, eventName, eventData) => handleEvent(gatewaySocket, gameId, eventName, eventData)
        );

        activeGames.set(newGame.id, {
            game: newGame,
            room: new Set([data.socketId])
        });

        socketGameId.set(data.socketId, newGame.id);

        newGame.start().then();

        gatewaySocket.emit("refreshStatus", {
            eventData: {
                status: "gameCreated",
                data: {id: newGame.id}
            },
            room: [data.socketId]
        });
    });

    gatewaySocket.on("nextMove", (data) => {
        const {gameId, playerId, move} = data.args[0];
        const gameData = activeGames.get(gameId);

        if (gameData) {
            const player = gameData.game.game.players[playerId];
            if (player)
                player.resolveMove(move);
        }
    });
});

server.listen(8002, () => {
    console.log("🎮 Game Service WebSocket listening on http://localhost:8002");
});
