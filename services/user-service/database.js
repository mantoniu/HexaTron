const {MongoClient, ObjectId} = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {DATABASE_ERRORS, USER_FIELDS, FRIENDSHIP_STATUS} = require("./utils");
const {leagueRank, switchOptions, orderByEloPipeline, addRankPipeline, groupPipelineCreation} = require("./pipeline-utils");
const {User} = require("../database-initializer/type-documentation");

const userCollection = process.env.USER_COLLECTION;
const refreshTokenCollection = process.env.TOKEN_COLLECTION;
const dbName = process.env.DB_NAME;
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(dbName);
const initialELO = 1000;

/**
 * Returns the league corresponding to the given ELO score.
 *
 * @param {number} score - The ELO score used to determine the league.
 * @return {string} - The league associated with this ELO score.
 */
function getLeague(score) {
    let league = "Wood";
    for (const elo of Object.keys(leagueRank)) {
        if (score >= elo) {
            league = leagueRank[elo];
        }
    }
    return league;
}

/**
 * Handles MongoDB errors and throws appropriate custom errors based on the error code.
 *
 * @param {Object} error - The error object returned from MongoDB.
 * @throws {Error} - Throws a custom error based on the error code.
 */
function handleMongoError(error) {
    switch (error.code) {
        case 11000:
            throw new Error(DATABASE_ERRORS.USERNAME_ALREADY_EXISTS);
        case 121:
            throw new Error(DATABASE_ERRORS.VALIDATION_FAILED);
        default:
            throw error;
    }
}

/**
 * Executes a MongoDB operation and handles any potential errors.
 *
 * @param {Function} operation - The MongoDB operation to execute (should return a promise).
 * @return {Promise<*>} - The result of the operation if successful.
 * @throws {Error} - Throws an error if the operation fails, handled by handleMongoError.
 */
async function mongoOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        handleMongoError(error);
    }
}

/**
 * Fetches a user along with their friends' details from the database.
 *
 * @param {Object} filter - The filter to find the user.
 * @param {Object} projection - The fields to exclude in the result.
 * @return {Promise<Object>} - The user with user's friends' details.
 */
async function getUserWithFriend(filter, projection) {
    projection.hasFriends = 0;
    let [user] = await mongoOperation(() => db.collection(userCollection).aggregate([
        // Step 1: Match the user based on the provided filter
        {
            $match: filter
        },

        // Step 2: Add the `hasFriends` field, which checks if the user has any friends
        {
            $addFields: {
                hasFriends: {$gt: [{$size: "$friends"}, 0]}
            }
        },

        // Step 3: Unwind the `friends` array to process each friend individually
        {
            $unwind: {
                path: "$friends",
                preserveNullAndEmptyArrays: true
            }
        },

        // Step 4: Lookup the friend details (ELO, name) from the `users` collection
        {
            $lookup: {
                from: "users",
                let: {friendId: "$friends.friendId"},
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$_id", "$$friendId"]
                            }
                        }
                    },
                    {
                        $project: {
                            elo: 1,
                            name: 1
                        }
                    }
                ],
                as: "friendsDetails"
            }
        },

        // Step 5: Add the `friends` field, enriching it with friend details
        {
            $addFields: {
                friends: {
                    $cond: {
                        if: {$eq: ["$hasFriends", true]},
                        then: {
                            "friendId": "$friends.friendId",
                            "elo": {$first: "$friendsDetails.elo"},
                            "name": {$first: "$friendsDetails.name"},
                            "league": {
                                $switch: switchOptions({$first: "$friendsDetails.elo"})
                            },
                            "status": "$friends.status"
                        },
                        else: []
                    }
                }
            }
        },

        // Step 6: Group back to the user level, pushing friend details into the `friends` array
        {
            $group: {
                _id: "$_id",
                ...Object.fromEntries(Object.keys(User.properties)
                    .filter(field => field !== "_id")
                    .map(field => field !== "friends" ? [field, {$first: `$${field}`}] : ["friends", {$push: "$friends"}])),
                hasFriends: {$first: "$hasFriends"}
            }
        },

        // Step 7: Ensure the `friends` field is set to an empty array if the user has no friends
        {
            $addFields: {
                friends: {
                    $cond: {
                        if: {$eq: ["$hasFriends", true]},
                        then: "$friends",
                        else: []
                    }
                }
            }
        },

        // Step 8: Apply the final projection (removes fields based on the `projection` parameter)
        {
            $project: projection
        }
    ]).toArray());
    if (user) {
        user.friends = Object.fromEntries(user.friends.map(({friendId, ...other}) => [friendId.toHexString(), other]));
    }
    return user;
}

/**
 * Fetches a user by applying a filter and optionally excluding specific fields.
 *
 * @param {Object} filter - The filter to find the user.
 * @param {Array<string>} excludedFields - List of fields to exclude from the result.
 * @return {Promise<Object>} - The user with its details.
 * @throws {Error} - Throws an error if the user is not found.
 */
async function getUserByFilter(filter, excludedFields = []) {
    const projection = excludedFields.reduce((acc, field) => ({...acc, [field]: 0}), {});

    let user;
    if (projection.hasOwnProperty(USER_FIELDS.friends)) {
        user = await mongoOperation(() =>
            db.collection(userCollection).findOne(
                filter,
                {projection}
            )
        );
    } else {
        user = await getUserWithFriend(filter, projection);
    }

    if (!user)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);

    if (!projection.hasOwnProperty(USER_FIELDS.league)) {
        user.league = getLeague(user.elo);
    }
    return user;
}

/**
 * Fetches a user by their name and optionally excludes specific fields from the result.
 *
 * @param {string} name - The name of the user to fetch.
 * @param {Array<string>} excludedFields - List of fields to exclude from the result.
 * @return {Promise<Object>} - The user details, possibly with excluded fields.
 * @throws {Error} - Throws an error if the user is not found.
 */
async function getUserByName(name, excludedFields = []) {
    return getUserByFilter({name}, excludedFields);
}

/**
 * Fetches a user by their id and optionally excludes specific fields from the result.
 *
 * @param {string} id - The name of the user to fetch.
 * @param {Array<string>} excludedFields - List of fields to exclude from the result.
 * @return {Promise<Object>} - The user details, possibly with excluded fields.
 * @throws {Error} - Throws an error if the user is not found.
 */
async function getUserByID(id, excludedFields = []) {
    return getUserByFilter({_id: new ObjectId(id)}, excludedFields);
}

/**
 * Generates a JSON Web Token (JWT) for a given user based on the access or refresh token type.
 *
 * @param {string} userId - The ID of the user for whom the token is being generated.
 * @param {boolean} access - Whether the token is for access (short-lived) or refresh (long-lived).
 * @return {string} - The generated JWT token.
 * @throws {Error} - Throws an error if the token generation fails.
 */
function generateToken(userId, access) {
    try {
        return jwt.sign(
            {userId},
            access ? process.env.ACCESS_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET,
            {expiresIn: access ? "15m" : "7d"}
        );
    } catch (error) {
        throw new Error(DATABASE_ERRORS.TOKEN_GENERATION_FAILED);
    }
}

/**
 * Generates a refresh token for a given user and stores it in the token collection.
 *
 * @param {string} userId - The ID of the user for whom the refresh token is being generated.
 * @return {Promise<string>} - The generated refresh token.
 * @throws {Error} - Throws an error if the token insertion into the database fails.
 */
async function generateRefreshToken(userId) {
    const token = generateToken(userId, false);
    const result = await mongoOperation(() =>
        db.collection(refreshTokenCollection).insertOne({userId, refreshToken: token})
    );
    if (!result.acknowledged)
        throw new Error(DATABASE_ERRORS.TOKEN_INSERT_FAILED);
    return token;
}

/**
 * Deletes a refresh token from the user collection by their ID.
 *
 * @param {string} userId - The ID of the user whose refresh token is to be deleted.
 * @return {Promise<boolean>} - Returns `true` if the refresh token was successfully deleted.
 * @throws {Error} - Throws an error if the token is not found or deletion fails.
 */
async function deleteToken(userId) {
    const result = await mongoOperation(() =>
        db.collection(refreshTokenCollection).deleteOne({userId})
    );
    if (result.deletedCount === 0)
        throw new Error(DATABASE_ERRORS.TOKEN_NOT_FOUND);
    return true;
}

/**
 * * Adds a new user to the user collection and generates their access and refresh tokens.
 *
 * @param {Object} newUser - The user data to be added to the database.
 * @return {Promise<Object>} - An object containing the generated access token, refresh token, and the user details.
 * @throws {Error} - Throws an error if the user creation fails or if there's an issue retrieving user data or generating tokens.
 */
async function addUser(newUser) {
    newUser.elo = initialELO;
    newUser.friends = [];

    const result = await mongoOperation(() =>
        db.collection(userCollection).insertOne(newUser)
    );

    const userId = result.insertedId.toHexString();
    try {
        const user = await getUserByID(userId, [USER_FIELDS.password, USER_FIELDS.answers]);
        const accessToken = generateToken(userId, true);
        const refreshToken = await generateRefreshToken(userId);
        return {accessToken, refreshToken, user};
    } catch (error) {
        await deleteUserByID(userId);
        throw error;
    }
}

/**
 * Retrieves the user ID by their username.
 *
 * @param {string} userName - The username of the user whose ID is to be retrieved.
 * @return {Promise<string>} - The user ID as a string.
 * @throws {Error} - Throws an error if the user is not found.
 */
async function getUserID(userName) {
    const user = await mongoOperation(() =>
        db.collection(userCollection).findOne({name: userName}, {projection: {_id: 1}})
    );
    if (!user)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);
    return user._id.toHexString();
}

/**
 * Deletes a user from the user collection by their ID.
 * Deletes this user's presence in the friends field of other users
 *
 * @param {string} userId - The ID of the user to be deleted.
 * @return {Promise<boolean>} - Returns `true` if the user was successfully deleted.
 * @throws {Error} - Throws an error if the user is not found or deletion fails.
 */
async function deleteUserByID(userId) {

    const result = await mongoOperation(() =>
        db.collection(userCollection).deleteOne({_id: new ObjectId(userId)})
    );

    if (result.deletedCount === 0)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);

    await mongoOperation(() => db.collection(userCollection).updateMany(
        {"friends.friendId": new ObjectId(userId)},
        {$pull: {friends: {friendId: new ObjectId(userId)}}}
    ));
    return true;
}

/**
 * Checks if the entered password matches their stored password.
 *
 * @param {string} credential - The username or user ID used to identify the user.
 * @param {string} enteredPwd - The password entered by the user to check.
 * @param {boolean} withID - Whether to use the user ID or username for lookup.
 * @return {Promise<Object>} - The user details (excluding password and answers) if the password matches.
 * @throws {Error} - Throws an error if the user is not found or the password does not match.
 */
async function checkPassword(credential, enteredPwd, withID) {
    const user = withID
        ? await getUserByID(credential, [USER_FIELDS.answers])
        : await getUserByName(credential, [USER_FIELDS.answers])
    if (!user)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);

    const match = await bcrypt.compare(enteredPwd, user.password);
    if (!match)
        throw new Error(DATABASE_ERRORS.INVALID_PASSWORD);

    const {password, ...res} = user;
    res._id = res._id.toHexString();
    return res;
}

/**
 * Updates the details of a user in the user collection.
 *
 * @param {Object} newUserData - The new data to update the user's details with.
 * @param {string} userId - The ID of the user to be updated.
 * @return {Promise<Object>} - The updated user details, excluding password and answers.
 * @throws {Error} - Throws an error if the user is not found or the update fails.
 */
async function updateUser(newUserData, userId) {
    const modification = await mongoOperation(() =>
        db.collection(userCollection).updateOne(
            {_id: new ObjectId(userId)},
            {$set: newUserData}
        )
    );

    if (modification.matchedCount === 0)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);
    return await getUserByID(userId, [USER_FIELDS.password, USER_FIELDS.answers]);
}

/**
 * Refreshes the access token for a given user by checking the presence of a valid refresh token.
 *
 * @param {string} userId - The ID of the user for whom the access token needs to be refreshed.
 * @return {Promise<string>} - The newly generated access token.
 * @throws {Error} - Throws an error if the refresh token is not found for the user.
 */
async function refreshAccessToken(userId) {
    const refreshTokenPresent = await mongoOperation(() =>
        db.collection(refreshTokenCollection).findOne({userId})
    );
    if (!refreshTokenPresent)
        throw new Error(DATABASE_ERRORS.TOKEN_NOT_FOUND);
    return generateToken(userId, true);
}

/**
 * Resets the password of a user after validating their security answers.
 *
 * @param {string} username - The username of the user requesting the password reset.
 * @param {Array<string>} answers - The security answers provided by the user.
 * @param {string} newPassword - The new password to be set for the user.
 * @return {Promise<boolean>} - Returns `true` if the password is successfully reset.
 * @throws {Error} - Throws an error if the security answers do not match or if the user is not found.
 */
async function resetPassword(username, answers, newPassword) {
    const userId = await getUserID(username);
    const user = await getUserByID(userId);
    if (!user.answers.every((el, i) => answers[i] === el))
        throw new Error(DATABASE_ERRORS.SECURITY_ANSWERS_MISMATCH);

    await updateUser({password: newPassword}, userId);
    return true;
}

/**
 * Fetches the ELO scores of multiple players from the database.
 *
 * @param {Array<string>} players - An array of player IDs whose ELO scores need to be fetched.
 * @return {Promise<Array<Object>>} - A list of player objects containing their ID and ELO score.
 * @throws {Error} - Throws an error if the database query fails.
 */
async function getElo(players) {
    players = players.map(id => new ObjectId(id));
    let result = await mongoOperation(() =>
        db.collection(userCollection).find({"_id": {"$in": players}}, {projection: {_id: 1, elo: 1}}).toArray()
    );
    result.forEach(player => player._id = player._id.toHexString());
    return result;
}

/**
 * Retrieves and generates a leaderboard for players, grouped by league and globally,
 * including their ranks based on their ELO scores.
 *
 * @return {Promise<Object>} - An object where the keys are league names or "Global" and
 * values are arrays of player objects with their details and ranks.
 * @throws {Error} - Throws an error if the database query fails.
 */
async function leaderboard() {
    const result = await db.collection(userCollection).aggregate([
        // Step 1: Add a new field 'league' based on the player's ELO using a $switch expression
        {
            $addFields: {
                league: {
                    $switch: switchOptions("$elo")
                }
            }
        },

        // Step 2: Create two facets:
        // - One for players grouped by league (byLeague)
        // - One for all players globally (global)
        {
            $facet: {
                byLeague: [
                    groupPipelineCreation("$league"),
                    orderByEloPipeline,
                    addRankPipeline
                ],

                global: [
                    groupPipelineCreation("Global"),
                    orderByEloPipeline,
                    addRankPipeline
                ]
            }
        },

        // Step 3: Combine the results from both facets (byLeague and global) into a single array
        {
            $project: {
                combined: {$concatArrays: ["$byLeague", "$global"]}
            }
        },

        // Step 4: Unwind the 'combined' array to separate individual player records
        {$unwind: "$combined"},

        // Step 5: Replace the root with the content of the 'combined' array (i.e., player records)
        {$replaceRoot: {newRoot: "$combined"}}
    ]).toArray();

    return Object.fromEntries(result.map(document => [document._id, document.players]));
}

/**
 * Retrieves the rank of a user in their league and globally based on their ELO score.
 *
 * @param {string} id - The user ID whose rank is to be retrieved.
 * @return {Promise<Object>} - An object containing the user's rank in user's league and globally.
 * @throws {Error} - Throws an error if the user cannot be found or a database query fails.
 */
async function getRank(id) {
    const user = await getUserByID(id);

    const rankLeagueOnly = await db.collection(userCollection).countDocuments({
        league: user.league,
        elo: {$gt: user.elo}
    }) + 1;

    const rankGlobal = await db.collection(userCollection).countDocuments({
        elo: {$gt: user.elo}
    }) + 1;

    return {[getLeague(user.elo)]: rankLeagueOnly, "Global": rankGlobal};
}

/**
 * Checks if a friendship exists between two users based on their user IDs.
 *
 * @param {string} userId - The ID of the user.
 * @param {string} friendId - The ID of the potential friend.
 * @return {Promise<Object|null>} - The friendship document if it exists, or null if no friendship is found.
 */
async function friendshipExisting(userId, friendId) {
    return await mongoOperation(() => db.collection(userCollection).findOne({
        _id: new ObjectId(userId),
        friends: {$elemMatch: {friendId: new ObjectId(friendId)}}
    }));
}

/**
 * Creates a friendship between two users by adding each user's ID to the other's "friends" attribute with the good status.
 *
 * @param {string} userId - The ID of the user sending the friend request.
 * @param {string} friendId - The ID of the user receiving the friend request.
 * @return {Promise<Object>} - The updated friendship details for both users.
 */
async function addFriend(userId, friendId) {

    const existingFriendship = await friendshipExisting(userId, friendId);

    if (!existingFriendship) {
        await mongoOperation(() => db.collection(userCollection).updateOne(
            {_id: new ObjectId(userId)},
            {$addToSet: {friends: {friendId: new ObjectId(friendId), status: FRIENDSHIP_STATUS.REQUESTED}}}
        ));
        await mongoOperation(() => db.collection(userCollection).updateOne(
            {_id: new ObjectId(friendId)},
            {$addToSet: {friends: {friendId: new ObjectId(userId), status: FRIENDSHIP_STATUS.PENDING}}}
        ));
    }

    const user = await getUserByID(userId);
    const friend = await getUserByID(friendId);

    return {userFriends: {id: friendId, friendData: user.friends[friendId]}, friend: {id: userId, friendData: friend.friends[userId]}};
}

/**
 * Accepts a friend request between two users, updating their friendship status to "friends".
 *
 * @param {string} userId - The ID of the user accepting the friend request.
 * @param {string} friendId - The ID of the user whose friend request is being accepted.
 * @return {Promise<Object>} - The updated friendship details for both users.
 */
async function acceptFriend(userId, friendId) {

    const existingFriendship = await friendshipExisting(friendId, userId);

    if (existingFriendship) {
        await mongoOperation(() => db.collection(userCollection).updateOne(
            {_id: new ObjectId(userId), "friends.friendId": new ObjectId(friendId)},
            {$set: {"friends.$.status": FRIENDSHIP_STATUS.FRIENDS}}
        ));

        await mongoOperation(() => db.collection(userCollection).updateOne(
            {_id: new ObjectId(friendId), "friends.friendId": new ObjectId(userId)},
            {$set: {"friends.$.status": FRIENDSHIP_STATUS.FRIENDS}}
        ));
    }

    const user = await getUserByID(userId);
    const friend = await getUserByID(friendId);

    return {userFriends: {id: friendId, friendData: user.friends[friendId]}, friend: {id: userId, friendData: friend.friends[userId]}};
}

/**
 * Removes a friend from both users' friend lists by removing the friend relationship.
 *
 * @param {string} userId - The ID of the user who wants to remove their friend.
 * @param {string} friendId - The ID of the friend to be removed from the user's friend list.
 * @return {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function removeFriend(userId, friendId) {
    const userObjectId = new ObjectId(userId);
    const friendObjectId = new ObjectId(friendId);

    await mongoOperation(() => db.collection(userCollection).updateOne(
        {_id: userObjectId},
        {$pull: {friends: {friendId: friendObjectId}}}
    ));

    await mongoOperation(() => db.collection(userCollection).updateOne(
        {_id: friendObjectId},
        {$pull: {friends: {friendId: userObjectId}}}
    ));
}

/**
 * Searches for players whose names start with the given query and returns the results after processing
 * @param {string} query - The query to search users by name.
 * @returns {Promise<Object[]>} - Returns a promise with a list of filtered and modified users.
 */
async function searchFroFriends(query) {
    const result = await db.collection(userCollection).aggregate([
        {
            $match: {name: {$regex: "^" + query + ".*", $options: "i"}}
        },
        {
            $addFields: {
                league: {
                    $switch: switchOptions("$elo")
                }
            }
        },
        {
            $project: {
                password: 0,
                answers: 0,
                friends: 0,
                parameters: 0
            }
        }]).toArray();

    result.forEach(user => user._id = user._id.toHexString());
    return result;
}

/**
 * Retrieves the friendship status between a user and a specified friend.
 *
 * @param {ObjectId} userId - The ID of the user whose status we want to check.
 * @param {ObjectId} friendId - The ID of the friend's status to retrieve.
 * @returns {string|null} - The friendship status if found, otherwise null.
 */
async function getFriendStatus(userId, friendId) {
    const user = await mongoOperation(() => db.collection("users").aggregate([
        {$match: {_id: userId}},
        {$unwind: "$friends"},
        {$match: {"friends.friendId": friendId}},
        {$project: {_id: 0, status: "$friends.status"}}
    ]).toArray());

    return user.length > 0 ? user[0].status : null;
}

module.exports = {
    deleteToken,
    addUser,
    generateToken,
    generateRefreshToken,
    checkPassword,
    updateUser,
    resetPassword,
    refreshAccessToken,
    deleteUserByID,
    getElo,
    leaderboard,
    getRank,
    addFriend,
    acceptFriend,
    removeFriend,
    searchFroFriends,
    getUserByID,
    getFriendStatus
};