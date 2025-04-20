# User Service

The **user service** is responsible for managing users. It has full access to the `users` and `refreshTokens`
collections. The service handles various aspects of user management, including user profiles, friend management, elo
score management, and token management. These elements are either stored directly in the user structure or, in the case
of tokens, are linked to the login, which is managed by this service. Therefore, it is logical for the User Service to
be responsible for managing these components.

As described [here](../../README.md#back-end-composition), the service follows a 3-layer architecture for handling HTTP requests. In addition, it includes a
separate **socket handler** responsible for managing WebSocket events exchanged with the client. An internal **event bus** is implemented to facilitate
communication between the **controller layer** of the 3-layer architecture and the **socket handler**. This enables seamless information transfer when there are
changes in friends part of the user data.
The **event bus** uses events based on the operations executed by the controller to transfer information. This design
helps decouple communication within the service, ensuring that components remain independent without introducing direct
dependencies between them.

## HTTP

The **HTTP** routes are used to perform various operations related to users, including:

- User login
- Refresh access token
- Account deletion
- Retrieve the leaderboard
- Profile modification
- Friend requests
- Accepting/Refusing friend requests
- Deleting friends

When a friend-related action is performed, an **HTTP** request is sent to the [Notifications](../notifications-service/README.md) Service. This allows it to
handle the corresponding notification logic and send a notification to the affected friend or potential friend to inform
them of the action.

When a user account is deleted, an **HTTP** request is sent to both the [Notifications](../notifications-service/README.md)
and [Chat](../chat-service/README.md) services. This allows
them to remove all elements linked to the user and notify connected clients about the deletion.

## WebSockets

A **WebSocket** connection is established between the client and the service once the user logs in, enabling real-time
communication. The client uses this connection to request and display the user list in the friend portal, just below the
search bar.

Beyond this, the WebSocket connection is used exclusively by the service to send modified data clients after changes
into user data. This includes updates related to friend interactions, such as accepting/refusing friend requests,
sending friend requests, removing friends, or when a friend deletes their account.

## Errors

When the client sends an **HTTP** request and an error occurs on the server side, the error is sent back in the response
and handled by the frontend.

In the case of a **WebSocket** request, which in this service is limited to retrieving the user list, if an error
occurs, an error event is emitted to the client.