# Gateway

The gateway serves as the single entry point for our entire backend architecture. It centralizes both **HTTP** and
**WebSocket** communications between the client and the various internal services. This architecture allows for unified
management of security, routing, and real-time connections, while hiding the internal complexity of microservices from
the client side.

## Service Configuration

Each service is defined through a clear and extensible configuration dictionary, which simplifies adding new services.
This configuration allows you to specify:

- the base URL of the service
- the **HTTP** path to expose publicly via the gateway
- the routes accessible without authentication
- whether authentication is required for each communication mode (**HTTP** or **WebSocket**)
- the dedicated WebSocket `namespace` (if applicable)
- the metadata to extract from the token (e.g., `userId`)

## Authentication Handling

The gateway handles all authentication logic, for both **HTTP** requests and **WebSockets**. It relies on a **JWT
double-token system**:

- A short-lived **access token**, used for each request
- A longer-lived **refresh token**, used to renew the first

This system improves security by limiting the exposure time of stolen tokens while allowing seamless user sessions.

## HTTP

For **HTTP** requests, the access token is extracted from the `Authorization` header. The gateway verifies it, and in
case of error, returns a **401** code (missing token) or **498** (invalid or expired token). If the verification
succeeds, the user ID is extracted from the token and injected into the header of the forwarded request. This allows
services to use it directly without having to decode the token themselves.

## WebSockets

On the **WebSocket** side, the frontend sends the token via the `auth.token` property. The gateway uses a verification
middleware (`namespace.use(...)`) with **Socket.IO** to validate this token as soon as a connection is attempted. If the
service requires authentication and the token is invalid or missing, the connection is denied and an error is sent to
the client.

When a connection is accepted, the gateway automatically establishes a mirror socket to the target service, completely
transparently to the client. For each client socket connected to a given namespace, an equivalent socket is created on
the gateway side to the corresponding namespace of the service. This results in an **n-to-n relationship**: each client
connected to the gateway leads to a dedicated connection to the associated service. Events received from the client are
forwarded to the service, and those from the service are sent back to the client, ensuring faithful and user-isolated
bidirectional relay.

## Production Security

In a production environment:

- All communications use secure **HTTPS** and **WSS** protocols.
- A dedicated HTTP server automatically redirects all incoming requests to their HTTPS equivalent (code **308**).