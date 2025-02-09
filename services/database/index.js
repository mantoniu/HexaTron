const {MongoClient} = require("mongodb");
const {User} = require("./TypesValidation");

const uri = "mongodb://root:root@localhost:27017/?authSource=admin";
const client = new MongoClient(uri);
const dbName = "database";
const db = client.db(dbName);
const collectionNamesList = ["users"];
const propertiesCollections = {
    users: User
};
const collectionsIndex = {
    users: {name: 1}
};

async function startService() {
    try {
        await client.connect();

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
                    validationAction: "error"
                });
                await db.collection(collectionName).createIndex(collectionsIndex[collectionName], {unique: true});
                console.log("Collection '${collectionName}' created with validation.");
            } else {
                console.log("The collection '${collectionName}' already exists.");
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