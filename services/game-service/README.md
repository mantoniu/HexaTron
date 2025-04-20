# Game Service

This service manages all the core game logic, ensuring proper setup and flow of games.

It handles:

- Creation and initialization of games according to their type (AI, local, ranked, friendly)
- Automatic assignment of players to rooms
- Automatic game start as soon as the required conditions are met (e.g., enough players)
- Deletion of inactive or incomplete games

## Websockets

This service primarily uses **WebSockets** to communicate with clients via the **[Gateway](./services/gateway/README.md)**, enabling persistent,
bidirectional, and real-time data exchange. It handles various game-related events such as player movements,
connections, disconnections, and more.

Each game is associated with a unique **room**. When a player joins a game, they are automatically added to the
corresponding room, allowing for efficient and targeted broadcasting of information to all participants within that
game.

It supports the following features:

- Joining or creating a game
- Sending a player's next move
- Leaving a game
- Handling player disconnections
- Updating a player's ELO rating in real time

## Communication with other services

Although the **HTTP** protocol is **not used to interact with the client**, it is used to communicate with other
internal services, such as:

- [**Notification Service**](../notifications-service/README.md):
    - Sends notifications when a `Friendly` game is created
    - Deletes the notification if the game creator leaves

- [**User Service**](../user-service/README.md):
    - Retrieves a player's ELO
    - Updates a player's ELO
