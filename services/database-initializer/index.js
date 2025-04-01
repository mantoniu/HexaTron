const {MongoClient} = require("mongodb");
const {User, RefreshToken, Conversation, Message, Notifications} = require("./type-documentation.js");
const uri = process.env.URI;
const client = new MongoClient(uri);
const dbName = process.env.DB_NAME;
const db = client.db(dbName);
const adminDb = client.db("admin");

// Define the schemas for each collection
const collectionSchemas = {
    [process.env.CONVERSATION_COLLECTION]: Conversation,
    [process.env.MESSAGE_COLLECTION]: Message,
    [process.env.USER_COLLECTION]: User,
    [process.env.TOKEN_COLLECTION]: RefreshToken,
    [process.env.NOTIFICATIONS_COLLECTION]: Notifications
};

// Define the indexes for each collection with unique constraints when necessary
const collectionIndexes = {
    // Index on 'participants' field in the conversation collection.
    // This helps speed up queries looking for conversations that involve specific participants.
    [process.env.CONVERSATION_COLLECTION]: [
        {keys: {participants: 1}}
    ],
    // Index on 'conversationId' field in the message collection.
    // This improves performance when retrieving messages for a specific conversation.
    [process.env.MESSAGE_COLLECTION]: [
        {keys: {conversationId: 1}, options: {unique: false}}
    ],
    // Index on 'name' field in the 'users' collection.
    // This will improve query performance when searching for users by name.
    [process.env.USER_COLLECTION]: [
        {keys: {name: 1}, options: {unique: true}}
    ],
    // Compound index on 'userID' and 'refreshToken' fields in the 'refreshTokens' collection.
    // This will improve query performance when looking up refresh tokens by user ID and token.
    [process.env.TOKEN_COLLECTION]: [
        {keys: {userId: 1, refreshToken: 1}, options: {unique: true}}
    ],
    //TODO commentary
    [process.env.NOTIFICATIONS_COLLECTION]: [
        {keys: {userId: 1}, options: {unique: true}}
    ]
};

const serviceRoles = {
    userService: {
        username: process.env.MONGO_USER_USERNAME,
        password: process.env.MONGO_USER_PWD,
        permissions: {
            [process.env.USER_COLLECTION]: ["find", "insert", "update", "remove"],
            [process.env.TOKEN_COLLECTION]: ["find", "insert", "update", "remove"]
        }
    },
    chatService: {
        username: process.env.MONGO_CHAT_USERNAME,
        password: process.env.MONGO_CHAT_PWD,
        permissions: {
            [process.env.CONVERSATION_COLLECTION]: ["find", "insert", "update", "remove"],
            [process.env.MESSAGE_COLLECTION]: ["find", "insert", "update", "remove"],
            [process.env.USER_COLLECTION]: ["find"]
        }
    },
    notificationService: {
        username: process.env.MONGO_NOTIFICATIONS_USERNAME,
        password: process.env.MONGO_NOTIFICATIONS_PWD,
        permissions: {
            [process.env.NOTIFICATIONS_COLLECTION]: ["find", "insert", "update", "remove"],
            [process.env.USER_COLLECTION]: ["find"]
        }
    }
};

async function startService() {
    try {
        // Connect to the MongoDB client
        await client.connect();

        // Loop through each service defined in `serviceRoles`
        for (const [serviceName, config] of Object.entries(serviceRoles)) {
            // Check if the service user already exists
            const userInfo = await adminDb.command({
                usersInfo: {user: config.username, db: "admin"}
            });

            // If the user doesn't exist, create it
            if (!userInfo?.users?.length) {
                await adminDb.command({
                    createUser: config.username,
                    pwd: config.password,
                    roles: []
                });
                console.log(`The user "${serviceName}" has been successfully created.`);
            }

            // Create a role name based on the service name
            const roleName = `${serviceName}Role`;

            // Check if the role already exists
            const roleInfo = await adminDb.command({rolesInfo: roleName});

            // If the role doesn't exist, create it
            if (!roleInfo?.roles?.length) {
                await adminDb.command({
                    createRole: roleName,
                    privileges: [],
                    roles: []
                });
                console.log(`The role "${roleName}" has been successfully created.`);
            }

            // Map the service's permissions to MongoDB privileges
            const privileges = Object.entries(config.permissions).map(([collection, actions]) => ({
                resource: {db: dbName, collection},
                actions
            }));

            // Grant the privileges to the role
            await adminDb.command({
                grantPrivilegesToRole: roleName,
                privileges
            });

            // Assign the role to the service user
            await adminDb.command({
                grantRolesToUser: config.username,
                roles: [roleName]
            });
        }

        // Loop through each collection defined in `collectionSchemas`
        for (const [collName, schema] of Object.entries(collectionSchemas)) {
            // Check if the collection already exists
            const exists = await db.listCollections({name: collName}).hasNext();

            // If the collection doesn't exist, create it
            if (!exists) {
                await db.createCollection(collName, {
                    validator: {
                        $jsonSchema: {
                            ...schema,
                            additionalProperties: false
                        }
                    }
                });

                // Create indexes for the collection
                for (const indexConfig of collectionIndexes[collName]) {
                    await db.collection(collName).createIndex(
                        indexConfig.keys,
                        indexConfig.options
                    );
                }

                console.log(`Collection ${collName} created successfully.`);
            }
        }
    } catch (error) {
        // Handle any errors that occur during initialization
        console.error("Error during initialization:", error);
    } finally {
        // Close the MongoDB connection
        await client.close();
        console.log("MongoDB connection closed.");
    }
}

startService().then(() => process.exit(0));