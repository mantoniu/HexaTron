# File Service

The **File Service** is the service that manages all file requests, so it is responsible for obtaining frontend files
for a user. It also manages interactions such as file uploads, with the API doc for example, or with user profile
pictures.

## Frontend

### SPA Architecture

Our application follows a **Single Page Application (SPA)** pattern: the initial load recovers a single HTML page, and
navigation between the different views (login, game, profile, etc.) is done entirely on the client side without a
complete reload. This ensures a fast, fluid user experience, with immediate transitions between pages.

### Components

To make our architecture reusable and better structured, we decided to use **WebComponents**. As we could not rely on an
external framework, we opted for the native API for customised HTML components (Custom Elements).

So we created a **`Component` base class** which centralises all the logic common to our components. In particular, it
provides a controlled lifecycle with:

- An asynchronous `connectedCallback` method, which dynamically loads the component's **HTML and CSS resources** via the
  `loadResources` method.
- These resources are retrieved from a dedicated folder (`/components/[name]/[name].html` and `.css`) using the
  `fetchResource` method.
- Once loaded, they are injected into the component's shadow DOM to ensure that the style and markup are encapsulated,
  using the `render` method.

To **optimise performance**, especially during navigation or when reusing identical components, we have implemented a **static cache mechanism**. Once a
component has loaded its resources for the first time, they are stored in memory.
Future instances of the same component reuse them without making new network calls, which reduces latency and lightens
the load on the server.

This approach allows us to maintain a modular, high-performance structure that respects modern web best practice, while
remaining independent of any framework.

### Frontend services

All our front-end services are based on the **Singleton** pattern, which ensures that a single instance of each service
is used throughout the application. This makes it easier to centralise state (such as the user, socket or current game),
avoid inconsistencies and simplify the management of dependencies between services.

We have also been careful to separate the business logic from the components: the services encapsulate all communication
with the backend or between components, while the components simply display the interface according to the data they
receive. In practice, only the components highest in the hierarchy interact directly with the services, and then
transmit the data to the child components.

Here are the different front-end services and their main roles:

- **Chat service**: manages all communications with the chat backend (messages, channels, etc.).
- **User service**: centralises user management (login, registration, profile updates, friends list, ranking) and
  synchronises data via the socket.
- **Game service**: orchestrates game management, interacting with the game engine and server, while maintaining a
  single source of truth for game status.
- **Notification service**: manage notifications (invitations, friend requests, etc.) in a consistent, centralised
  manner.
- **Socket service**: encapsulates the WebSocket connection with the backend. It is responsible for opening the
  connection with a JWT `accessToken` (retrieved from the `UserService`), guaranteeing secure authentication. It also
  centralises management of reconnection or disconnection if required.

This organisation makes the code more readable, modular and easy to maintain, while promoting reusability.

#### API Client

To standardise and simplify **HTTP** communication across the application, all services that perform network requests
rely on a shared `ApiClient` instance. This client is also implemented as a **Singleton** and is responsible for:

- Sending **HTTP** requests using a consistent interface
- Automatically attaching authentication tokens (`accessToken`)
- Refreshing expired tokens when needed
- Centralising error handling and status code interpretation
- Gracefully handling network failures or session expiration

By abstracting these responsibilities, `ApiClient` allows services to focus purely on business logic without worrying
about low-level networking details.

## Profile picture management

In this project, we chose to use the **File Service** to store users' profile pictures. Storing the images in base64
directly in the database would have made the latter considerably heavier, while limiting the quality of the images that
could be saved.

In order to guarantee a good compromise between performance, quality and security, we perform front-end cropping of
images to 512x512 pixels. We also impose size limits on the front-end and back-end to prevent any abuse or overloading.

To **optimise network usage** and minimise loading times, we generate and store **three versions** of each image:

- A **large** version: the original image cropped to 512x512 pixels
- A **medium** version: 256x256 pixels
- A **small** version: 64x64 pixels

The **front-end component** in charge of profile pictures automatically selects the version best suited to the space
available, ensuring intelligent, high-performance display management.

Finally, image storage is made **persistent** thanks to a **Docker volume** mounted on the `storage` folder of the **File Service**.