# Chat Service

The **chat service** is responsible for managing conversations and messages. It has full access to the `conversations`
and `messages` collections, and read-only access to the `user` collection. This service handles all operations related
to conversations, such as creating or retrieving them, as well as message-related actions like marking messages as read
or deleting them.

The data is split across two distinct collections to ensure clarity and avoid redundancy:

- One collection stores metadata related to conversations themselves, such as the list of participants, whether the
  conversation is global, and the creation date.
- The other collection stores individual messages, including details like the sender's ID, the associated conversation
  ID, timestamps, and message content.

This separation allows for a clean data structure where each conversation and message is represented by its own
document. It prevents duplication of conversation-related information in every message entry and improves both data
integrity and query performance.

When a message is sent in a conversation by a user, an **HTTP** request is sent to the [Notifications service](../notifications-service/README.md). This
allows it to notify the other user about the new message.

## HTTP

The **HTTP** routes are used primarily to:

- Retrieve conversations on demand from the client
- Handle account deletion operations and is used by the [User Service](../user-service/README.md)

These operations are stateless and do not require maintaining a persistent connection between the client and the
service.

## WebSockets

A **WebSocket** connection is established between the client and the service once the user logs in, enabling real-time
communication.

The client uses this connection to:

- Send messages in chat
- Create or join conversations
- Read messages
- Delete messages

Beyond this, the **WebSocket** connection is used exclusively by the service to update client data after specific
operations:

- Deletion of messages in a conversation in which the client participates
- Sending of messages in a conversation in which the client participates

## Errors

When the client requests to fetch all conversations via **HTTP**, if the service fails to retrieve all the
conversations, it sends an error to notify the client.

In the case of a **WebSocket** request, if an error occurs for an event sent by the client, an error event is emitted to
the client, explaining the nature of the error.
