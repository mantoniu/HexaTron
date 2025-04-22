# PS8 - HEXATRON

## Team

- Antoine-Marie Michelozzi
- Jilian Lubrat

## Run Backend

To run the project, you need to have Docker and Docker Compose installed.

There are two possible run modes:

- Development Mode
- Production Mode

### 1. Development mode

The development mode allows you to edit the front, without having to rebuild the ```files-service```, just by refreshing
the page.
The ```front``` directory of the ```files-service``` is not copied in the container but mounted as a volume.

This setup is achieved by merging two Docker Compose files: the main ```docker-compose.yml``` file and the ```docker-compose.dev.yml``` file.

To launch in development mode, run the following command:

 ```bash
 docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file Variables.env up -d --build 
 ```

In development mode, the backend is only accessible over **HTTP**, with a limited range of allowed origins due to the CORS policy. It is intended for local
access only.
### 2. Production mode

The production is the default mode. The ```front``` directory of the ```files-service``` is copied in the container.

To launch in production mode, run the following command:

 ```bash
 docker-compose --env-file Variables.env up -d --build 
 ```

In production mode, the backend is only accessible over **HTTPS**, and if you try to access it via **HTTP**, you are redirected. The CORS policy limits the
range of allowed origins, just like in development mode.

## Website

To access the web version of our app, you have two options:

- **Local access (development mode):**  
  If you run the backend locally in development mode, you can access the website at [http://localhost:8000](http://localhost:8000). This requires the backend to
  be running on your machine. Refer to the earlier section for instructions on how to launch the backend in development mode.

- **Online access (production mode):**  
  If you do not run the backend locally, you can access the app in production mode at [https://hexatron.ps8.pns.academy](https://hexatron.ps8.pns.academy). This
  version connects to the production backend, which is hosted and configured for deployment.

## Android App

You can run the mobile app in two modes:

- Development mode
- Production mode

### Development Mode

In development mode, the app connects to a locally running backend. Similar to the website, the app will use **HTTP** for communication in this mode. This is
useful for development and debugging, but requires some setup:

#### Requirements:

1. Both the mobile device and the computer hosting the backend must be connected to the same local network (Wi-Fi).
2. You must allow incoming connections on port 8000 from the mobile device. You can do this by running the following command in PowerShell (as administrator):

```bash
netsh advfirewall firewall add rule name="HexaTron Dev Mode" protocol=TCP dir=in localport=8000 action=allow enable=yes
```

#### Synchronising for Development:

To configure the mobile app to use your local backend, open a terminal in the `services/file` folder and run:

```bash
npm run sync:dev
```

If your Wi-Fi IP address starts with `192.168.1.XXX`, it will be detected automatically.  
Otherwise, you can specify the IP manually like this:

```bash
npm run sync:dev -- XXX.XXX.XXX.XXX
```

*Make sure to use the **Wi-Fi interface IP** of your computer, not another one.*

In both case it will automatically trigger `npx cap sync` to synchronise the app.

### Production Mode

In production mode, the app connects via **HTTPS** to the deployed backend server for all operations such as login, account management, and gameplay. This mode
requires no special configuration and uses the existing deployed endpoint.

To configure the mobile app for production mode, open a terminal in the `services/file` folder and run:

```bash
npm run sync:prod
```

This will automatically trigger `npx cap sync` to synchronise the app.


---

## Implemented features

The various features we have implemented fall into several main categories: `Game related features`,
`User related features`, `Chat related features`, and finally `Notifications related features`. Here, we present the
various functionalities we have implemented for them.

### Game related features

To begin with, here are the different types of game we have implemented:

- **Local 1V1** : This game mode allows two players on the same device to play our game, with both the first and second
  player's keys configurable in the drawer menu's `parameters` tab.

- **IA** : The `AI` mode allows the user to take on our AI, which is based on the MinMax algorithm. It is powerful
  enough to be highly challenging and allows the player to truly test their strategic skills against a smart and
  reactive opponent.

- **Ranked**: The ranked mode allows users to play ranked games against other online users. An ELO system is
  implemented, and depending on its value, the user will be assigned a league:

  - `Wood league`: negative ELO
  - `Stone league`: between 0 and 999
  - `Iron league`: between 1000 and 1249
  - `Silver league`: between 1250 and 1499
  - `Gold league`: between 1500 and 1749
  - `Platinium league`: between 1750 and 1999
  - `Diamond league`: above 2000

  Users can also see where they stand in relation to others in the leaderboard section of the drawer menu and select a
  specific league to see its players and their ELO.

- **Friendly**: We have also implemented a feature that lets friends challenge each other, so it is possible to play
  with friends through requests on a friend's profile.

### User related features

We will now take a look at the various functionalities implemented as part of user management.

#### Registration

To begin with, a user must register. He can then choose a **username** in compliance with the following constraints:

- Minimum **4 characters**
- Maximum **20 characters**
- **No special characters** allowed

Next, the user must define a **password** containing **at least 8 characters**.

To prevent users from forgetting their password, **three security questions** will be asked. These will enable them to
retrieve their account at a later date.

#### Login

Once an account has been created, the user can log in using the **identifiers** configured when registering.

If the user enters:

- a **non-existent username**, or
- an **incorrect password**,

an **error popup** will be displayed to provide clear feedback.

#### Updating Profile Information

On their profile, a user can update the following:

- their **username**
- their **password**
- their **profile picture**

To change their password, the user must first enter their **current password**, then create a **new one** and **confirm it**.

When uploading a new **profile picture**, a **loading spinner** is displayed during the upload process to avoid leaving
the user without feedback.  
After the upload:

- If successful, a **confirmation message** will appear.
- If the upload fails (due to a **server error** or a **file that is too large**), an **error message** will be
  displayed.

For any update (username, password, or profile picture), the user will receive feedback:

- A **success popup** will be shown if the change was successful.
- In case of **failure** (incorrect current password, username already taken), an **error message** will inform the
  user.

#### Session Management

The authentication system relies on two types of tokens:

- An **access token**, valid for **15 minutes**, used to authenticate API requests.
- A **refresh token**, valid for **7 days**, used to renew the access token without requiring the user to log in again.

When the access token expires, as long as the refresh token is still valid, a **new access token** is automatically
generated to maintain the user's session seamlessly.

If **both tokens expire**, the user will be required to **log in again**.

This setup ensures both **security** and a **smooth user experience**, keeping sessions active without frequent
interruptions while still protecting sensitive information.

### Chat related features

We have implemented two types of chats: a **global chat** and a **friend-to-friend chat**.

#### Global Chat

- The global chat is accessible as soon as a user is logged in.
- It allows users to exchange messages with **all other connected users**.
- It can be accessed directly by clicking on the **message icon** in the **navigation bar**.

#### Friends Chat

- A **toggle button** located above the chat allows users to switch to the `Friends` tab.
- Once selected:
  - A **list of conversations** with friends is displayed.
  - Each conversation includes:
    - The **latest message**.
    - A **colored dot** indicating **unread messages**.

To open a conversation with a friend:

- Go to the **friends list** and select a profile.
- Or use the **chat button** available in the list.

#### Message Management

- Users can **delete their own messages**.
- Messages that are not yet saved on the server will have a **distinct appearance** and **loading icon** is displayed
  next to these messages to inform the user that the message is still being sent.

### Notifications related features

We have also implemented a notification system to inform users of relevant events in real time.

Notifications are triggered for the following events:

- Receiving a friend request
- Acceptance of a friend request
- Receiving a new message (friends chat)
- Receiving a game invitation from a friend

Notifications are accessible via the **notification icon** located in the **navigation bar**.

When a new notification arrives:

- It is added to the **notification panel**
- It appears with a **distinct visual indicator** if it has not yet been read
- The panel displays for each notification the **type of event** and its **content**.

## Back-end composition

The back-end is composed of the following elements:

- [Gateway](./services/gateway/README.md)
- Initializer:
  - [Database initializer](./services/database-initializer/README.md)
  - [Api initializer](./services/documentation-api/README.md)
- Services:
  - [File service](./services/files/README.md)
  - [Game service](./services/game-service/README.md)
  - [User service](./services/user-service/README.md)
  - [Notifications service](./services/notifications-service/README.md)
  - [Chat service](./services/chat-service/README.md)

The two initialization scripts are launched by Docker Compose, execute their tasks, and then terminate.

Each service is assigned a specific area of responsibility to prevent the creation of monolithic services and to ensure a more flexible and scalable backend
architecture. With this approach, there is a single entry point, the **[Gateway](./services/gateway/README.md)**, which eliminates the need to secure each service individually.

All services that expose HTTP endpoints are built on the same foundation, which follows a 3-tier architecture pattern:

- **Route layer**: Defines the available HTTP routes and links each route to its corresponding controller function. (Note: this layer is not used by the file
  service.)
- **Controller layer**: Contains the logic to be executed for each route. It processes incoming requests, applies business rules, and delegates data-related
  operations to the database layer if needed.
- **Database layer**: Encapsulates all operations performed on the underlying database, such as queries, inserts, updates, and deletions.

In addition, each of these services (except the file service) includes an options file used to generate its own API documentation.
The API documentation from all services is then merged to produce a global API documentation, which is hosted by the file service.
This unified documentation presents all the HTTP endpoints of all services and is accessible via a Swagger UI at https://hexatron.ps8.pns.academy/api/doc.

This architectural consistency ensures clear separation of concerns, improves maintainability, and allows for easier testing and scalability across services.

To avoid duplication of code and ensure consistent management of **HTTP** requests between the different services, the routing logic is centralised in a common
utility file, `routing-utils.js`. This file is integrated into each service when the container is built. It is used to declare routes using a simple dictionary,
specifying only the method, path and associated controller function. In addition to this declaration, `routing-utils.js` also encapsulates all the processing
associated with **HTTP** requests: extraction of URL segments, conditional parsing of the body (when in JSON format), dynamic route resolution and standardised
error handling. Thanks to this structure, each service benefits from consistent behaviour in the face of malformed requests, non-existent routes or internal
errors, while considerably simplifying the code required to expose new routes. This approach enhances the readability, maintainability and robustness of the
back-end architecture as a whole.

### Communication

In this project, WebSockets (managed with Socket.IO) are used by several services: the **game**, **chat**, **user** and **notification** services. We chose to
use **WebSockets** in these services because, unlike the **HTTP** protocol, which operates on a request/response model, they enable a persistent connection to
be established between the client and the server. This makes it possible to exchange data bidirectionally and in real time, without having to restart a request
each time an update is made. This continuous communication is essential, for example, for transmitting players' movements in real time, detecting a user's
disconnection, or enabling instant chat between users.

For everything that does not require a stateful connection, we use **HTTP**, following the **REST** architecture as far as possible. **HTTP** is well suited to
stateless operations, where each request contains all the information needed to be processed independently. This includes tasks such as deleting a user,
retrieving a list of a user's conversations or managing inter-service communication within the backend. These operations do not require real-time updates or
persistent connections, making **REST** over **HTTP** a natural and efficient choice.

All communications, whether over **HTTP** or **WebSocket**, are secured using authentication tokens (access token and refresh token). The way these tokens are
validated and propagated throughout the system (especially in the context of real-time communication) will be covered in more detail in the section dedicated to
the **[Gateway](./services/gateway/README.md)**.
