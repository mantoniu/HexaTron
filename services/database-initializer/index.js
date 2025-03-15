const {MongoClient} = require("mongodb");
const {User, RefreshToken, Conversation, Message} = require("./type-documentation.js");
const uri = process.env.URI;
const client = new MongoClient(uri);
const dbName = process.env.DB_NAME;
const db = client.db(dbName);
const adminDb = client.db("admin");

// Define the schemas for each collection
const propertiesCollections = {
    conversations: Conversation,
    messages: Message,
    users: User,
    refreshTokens: RefreshToken
};

// Define the indexes for each collection with unique constraints when necessary
const collectionsIndex = {
    // Index on 'participants' field in the 'conversations' collection.
    // This will improve query performance when searching for conversations by participants.
    conversations: {index: {participants: 1}, unique: false},

    // Index on 'conversationId' field in the 'messages' collection.
    // This will improve query performance when searching for messages by conversation.
    messages: {index: {conversationId: 1}, unique: false},

    // Index on 'name' field in the 'users' collection.
    // This will improve query performance when searching for users by name.
    users: {index: {name: 1}, unique: true},

    // Compound index on 'userID' and 'refreshToken' fields in the 'refreshTokens' collection.
    // This will improve query performance when looking up refresh tokens by user ID and token.
    refreshTokens: {index: {userID: 1, refreshToken: 1}, unique: true}
};

const collections = process.env.COLLECTIONS.split(",").map(collection => collection.trim());

const users = process.env.USERS.split(",").map(user => {
    user = user.split(";");
    return {"userName": user[0], "password": user[1]};
});

const users_collections = {
    [collections[0]]: users[0],
    [collections[1]]: users[0],
    [collections[2]]: users[1],
    [collections[3]]: users[1],
};

async function startService() {
    try {
        await client.connect();

        for (const collectionName of Object.keys(users_collections)) {
            const user = await adminDb.command({usersInfo: users_collections[collectionName]["userName"]});
            if (!user?.users?.length) {
                await adminDb.command({
                    createUser: users_collections[collectionName]["userName"],
                    pwd: users_collections[collectionName]["password"],
                    roles: []
                });
                console.log(`The user "${users_collections[collectionName]["userName"]}" has been successfully created.`);
            }

            const existingRole = await adminDb.command({rolesInfo: users_collections[collectionName]["userName"]});
            if (!existingRole?.roles?.length) {
                await adminDb.command({
                    createRole: users_collections[collectionName]["userName"],
                    privileges: [
                        {
                            resource: {db: dbName, collection: collectionName},
                            actions: ["find", "insert", "update", "remove"]
                        }
                    ],
                    roles: []
                });
                console.log(`The role "${users_collections[collectionName]["userName"]}" has been successfully created.`);
            }

            await adminDb.command({
                grantPrivilegesToRole: users_collections[collectionName]["userName"],
                privileges: [
                    {
                        resource: {db: dbName, collection: collectionName},
                        actions: ["find", "insert", "update", "remove"]
                    }
                ]
            });

            await adminDb.command({
                grantRolesToUser: users_collections[collectionName]["userName"],
                roles: [
                    {role: users_collections[collectionName]["userName"], db: "admin"}
                ]
            });

            const existentCollections = await db.listCollections({}, {nameOnly: true}).toArray();
            const collectionExists = existentCollections.some(collection => {
                return collection.name === collectionName;
            });
            if (!collectionExists) {
                await db.createCollection(collectionName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            required: Object.keys(propertiesCollections[collectionName]),
                            properties: propertiesCollections[collectionName]
                        }
                    },
                    validationAction: "error"
                });

                // Create the index dynamically based on the structure in collectionsIndex
                const {index, unique} = collectionsIndex[collectionName];
                await db.collection(collectionName).createIndex(index, unique ? {unique: true} : {});

                console.log(`Collection '${collectionName}' created with validation.`);
            } else {
                console.log(`The collection '${collectionName}' already exists.`);
            }
        }

    } catch (error) {
        console.error("Error during initialization: ", error);
    } finally {
        await client.close();
        console.log("MongoDB connection closed");
    }
}

startService().then(() => process.exit(0));