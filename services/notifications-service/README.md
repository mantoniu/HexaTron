# Notifications Service

The **notifications service** is responsible for managing notifications. It has full access to the ```notifications```
collection and read-only access to the ```users``` collection.

As described [here](../../README.md#back-end-composition), the service follows a 3-layer architecture for handling HTTP requests. In addition, it includes a
separate **socket handler** responsible for managing WebSocket events exchanged with the client. An internal **event-bus** is implemented to facilitate
communication between the **controller layer** of the 3-layer architecture and the **socket handler**. This enables seamless information transfer when external
events occur, such as when another service
updates a notification or when a user’s status changes. The **event-bus** is implemented using events based on the
operations executed by the controller to transfer information. This helps decouple communication within the service,
ensuring that components remain independent without introducing direct dependencies between them.

## HTTP

The **HTTP** routes are used exclusively by other services to add or delete notifications, or to remove all
notifications related to a user when that user is deleted. This communication method is chosen because it does not
require a persistent bidirectional connection between services a simple one-time request is sufficient to perform these
operations efficiently.

## WebSocket

A **WebSocket** connection is established between the client and the service after the user logs in, allowing real-time
communication. The client uses this connection, for example, to inform the service when a notification has been read.
The service, in turn, uses it to notify the client when an operation has been successfully completed or when changes
occur in the user's notifications due to external events, for instance, if a user sends a friend request and later
deletes their account, the corresponding notification is automatically removed.

## Errors

When the client sends an event through the socket to communicate with the service, for example, to mark a notification
as read, and an error occurs, an ```error``` event is emitted to notify the client of the issue. The error event
includes a message adapted to the specific event, providing clear feedback about the encountered problem.