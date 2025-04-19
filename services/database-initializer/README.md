# Database Initializer

## Database Presentation

The database is shared by all services but is composed of distinct collections. There are five main collections:

- **Users**: Stores all information related to users
- **Conversation**: Stores all conversations between users
- **Message**: Stores all messages from all conversations
- **Notifications**: Stores user notifications
- **Refresh Token**: Stores refresh tokens for all users

For each collection, the schema is configured so that fields are defined with their respective types. This helps prevent
type-related issues or missing fields, ensuring consistent and reliable data handling between the front end and the back
end.

In addition, specific users and roles are created for each service to control database access. For example, the [Chat
service](../chat-service/README.md) may have read-only access to the **Users** collection but no write access. This approach ensures proper
separation of permissions and responsibilities between services.

These schemas are defined in the `type-documentation.js` file and reused by other services to generate the API, ensuring
consistency in the types of data sent or received in each request.

## Usage of the Database Initializer

The role of the database initializer is to create collections if they do not already exist, and to set up the necessary
roles and users at each `docker-compose up`.  
It is designed to make it easy to add new collections, roles, or users whenever a new service is introduced or an
existing service requires additional access or structures.

The initializer is executed automatically at the start of the deployment process.  
It waits until the **MongoDB** service is fully up and reachable (via a ping), and then it connects to the database
using the root credentials. This allows it to create collections, apply schema validation rules, and define users and
roles with fine-grained access controls.

Once its tasks are completed, the initializer container shuts down automatically. This ensures it only runs when needed
and avoids consuming unnecessary resources.
