const {MongoClient} = require("mongodb");
const {User} = require("./TypesValidation");

const uri = "mongodb://root:root@localhost:27017/?authSource=admin";
const client = new MongoClient(uri);
const dbName = "database";
const collectionNamesList = ["users"];
const propertiesCollections = {
    users: User
};

async function startService() {
    try {
        await client.connect();

        const db = client.db(dbName);
        const collections = await db.listCollections({}, {nameOnly: true}).toArray();

        for (const collectionName of collectionNamesList) {

            const collectionExists = collections.some(collection => collection.name === collectionName);

            if (collectionExists) {
                await db.createCollection(collectionName, {
                    validator: {
                        $jsonSchema: {
                            bsonType: "object",
                            required: Object.keys(propertiesCollections[collectionName]),
                            properties: propertiesCollections[collectionName]
                        }
                    },
                    validationAction: "error" // Rejeter les documents qui ne respectent pas la validation
                });
                console.log("Collection '${collectionName}' created with validation.");
            } else {
                console.log("The collection '${collectionName}' already exists.");
            }
        }

    } catch (err) {
        console.error("Connection error: ", err);
    }
}


async function createUser(data) {
    const db = client.db(dbName);


    const result = await db.collection("users").insertOne(data);

    const users2 = await db.collection("users").find().toArray();
    console.log(users2, result);
}


async function main() {
    const db = client.db(dbName);

    for (const collectionName of collectionNamesList) {
        const collections = await db.listCollections({name: collectionName}).toArray();
        await db.dropCollection(collectionName);
    }
    await startService();
    await createUser({name: "Jilian", email: "test@test.com", age: 20});
}


main();


process.on("SIGINT", async () => {
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
});