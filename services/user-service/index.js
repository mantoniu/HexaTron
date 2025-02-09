const {MongoClient} = require("mongodb");
const {bcrypt} = require("bcrypt");

const uri = "mongodb://root:root@localhost:27017/?authSource=admin";
const client = new MongoClient(uri);
const dbName = "database";
const db = client.db(dbName);
const collectionName = "users";
const saltRounds = 10;

async function addUser(newUser) {
    try {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(newUser.password, salt, function (err, hash) {
                newUser.password = hash;
            });
        });
        const result = await db.collection(collectionName).insertOne(newUser);
        if (!result.acknowledged) {
            console.error("Insertion failed");
            return null;
        }
        const user = await getUserByID(result.insertedId);
        if (!user) {
            console.log("No user found after insertion");
            return null;
        }
        return user;
    } catch (error) {
        if (error.code === 121) {
            console.error("Data validation error: ", error.message);
        } else if (error.code === 11000) {
            console.error("Key uniqueness error: ", error.message);
        } else {
            console.error("Error while trying to add user to the database: ", error.message);
        }
        return null;
    }
}

async function getUserID(userName) {
    try {
        const userID = await db.collection(collectionName).findOne({name: userName}, {projection: {_id: 1}});
        if (!userID) {
            console.error("User not Found");
            return null;
        }
        return userID;
    } catch (error) {
        console.error(`Error while trying to find the user '${userName}': `, error.message);
        return null;
    }
}

async function getUserByID(userID) {
    try {
        const user = await db.collection(collectionName).findOne({_id: userID}, {projection: {password: 0}});
        if (user) {
            console.error("User not Found");
            return null;
        }
        return user;
    } catch (error) {
        console.error(`Error while trying to find the user '${userID}': `, error.message);
        return null;
    }
}

async function deleteUserByID(userID) {
    try {
        const result = await db.collection(collectionName).deleteOne({_id: userID});
        if (result.deletedCount === 1) {
            console.log("Successfully deleted one document.");
        } else {
            console.log(`No user matched the id: '${userID}'. Deleted 0 user.`);
        }
    } catch (error) {
        console.error(`Error while trying to delete the user '${userID}': `, error.message);
        return null;
    }
}

async function checkPassword(userID, password) {
    try {
        const user = await db.collection(collectionName).findOne({_id: userID});
        if (user) {
            console.error("User not Found");
            return null;
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            return user;
        }
        console.error("The password doesn't match");
        return null;
    } catch (error) {
        console.error(`Error while trying to check the password of the user '${userID}': `, error.message);
        return null;
    }
}

async function modifyUser(user) {
    try {
        const result = await checkPassword(user._id, user.password);
        if (!result) {
            console.error("Error during password checking");
            return null;
        }
        const modification = await db.collection(collectionName).replaceOne({_id: user._id}, user);
        if (result.modifiedCount === 1) {
            console.log("Update achieve");
        } else {
            console.log("No update achieve");
        }
    } catch (error) {
        console.error(`Error while trying to modify the user '${user._id}': `, error.message);
        return null;
    }
}

process.on("SIGINT", async () => {
    await client.close();
    console.log("MongoDB connection closed");
    process.exit(0);
});