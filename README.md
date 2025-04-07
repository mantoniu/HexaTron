# PS8 - HEXATRON

## Team

- Antoine-Marie Michelozzi
- Jilian Lubrat

## Run

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

 ``` 
 docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file Variables.env up -d --build 
 ```

### 2. Production mode

The production is the default mode. The ```front``` directory of the ```files-service``` is copied in the container.

To launch in production mode, run the following command:

 ``` 
 docker-compose --env-file Variables.env up -d --build 
 ```

 
---

## Implemented features

The various features we have implemented fall into several main categories: `Game related features`,
`User related feature`, `Chat related features`, and finally `Notifications related features`. Here, we present the
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

To change their password, the user must first enter their **current password**, then create a **new one** and **confirm
** it.

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