const {MongoClient, ObjectId} = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {DATABASE_ERRORS, USER_FIELDS} = require("./utils");
const {leagueRank, switchOptions, addEloPipeline, addRankPipeline, groupPipelineCreation} = require("./pipeline-utils");

const userCollection = process.env.USER_COLLECTION;
const refreshTokenCollection = process.env.TOKEN_COLLECTION;
const dbName = process.env.DB_NAME;
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(dbName);
const initialELO = 1000;

function getLeague(score) {
    let league = "Wood";
    for (const elo of Object.keys(leagueRank)) {
        if (score >= elo) {
            league = leagueRank[elo];
        }
    }
    return league;
}

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

async function mongoOperation(operation) {
    try {
        return await operation();
    } catch (error) {
        handleMongoError(error);
    }
}

async function getUserByFilter(filter, excludedFields = []) {
    const projection = excludedFields.reduce((acc, field) => ({...acc, [field]: 0}), {});

    const user = await mongoOperation(() =>
        db.collection(userCollection).findOne(
            filter,
            {projection}
        )
    );

    if (!user)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);

    user.league = getLeague(user.elo);
    return user;
}

async function getUserByName(name, excludedFields = []) {
    return getUserByFilter({name}, excludedFields);
}

async function getUserByID(id, excludedFields = []) {
    return getUserByFilter({_id: new ObjectId(id)}, excludedFields);
}

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

async function generateRefreshToken(userId) {
    const token = generateToken(userId, false);
    const result = await mongoOperation(() =>
        db.collection(refreshTokenCollection).insertOne({userId, refreshToken: token})
    );
    if (!result.acknowledged)
        throw new Error(DATABASE_ERRORS.TOKEN_INSERT_FAILED);
    return token;
}

async function deleteToken(userId) {
    const result = await mongoOperation(() =>
        db.collection(refreshTokenCollection).deleteOne({userId})
    );
    if (result.deletedCount === 0)
        throw new Error(DATABASE_ERRORS.TOKEN_NOT_FOUND);
    return true;
}

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

async function getUserID(userName) {
    const user = await mongoOperation(() =>
        db.collection(userCollection).findOne({name: userName}, {projection: {_id: 1}})
    );
    if (!user)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);
    return user._id.toHexString();
}

async function deleteUserByID(userId) {
    const result = await mongoOperation(() =>
        db.collection(userCollection).deleteOne({_id: new ObjectId(userId)})
    );
    if (result.deletedCount === 0)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);
    return true;
}

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

async function refreshAccessToken(userId) {
    const refreshTokenPresent = await mongoOperation(() =>
        db.collection(refreshTokenCollection).findOne({userId})
    );
    if (!refreshTokenPresent)
        throw new Error(DATABASE_ERRORS.TOKEN_NOT_FOUND);
    return generateToken(userId, true);
}

async function resetPassword(username, answers, newPassword) {
    const userId = await getUserID(username);
    const user = await getUserByID(userId);
    if (!user.answers.every((el, i) => answers[i] === el))
        throw new Error(DATABASE_ERRORS.SECURITY_ANSWERS_MISMATCH);

    await updateUser({password: newPassword}, userId);
    return true;
}

async function getElo(players) {
    players = players.map(id => new ObjectId(id));
    let result = await mongoOperation(() =>
        db.collection(userCollection).find({"_id": {"$in": players}}, {projection: {_id: 1, elo: 1}}).toArray()
    );
    result.forEach(player => player._id = player._id.toHexString());
    return result;
}

async function leaderboard() {
    const result = await db.collection(userCollection).aggregate([
        {
            $addFields: {
                league: {
                    $switch: switchOptions
                }
            }
        },
        {
            $facet: {
                byLeague: [
                    groupPipelineCreation("$league"),
                    addEloPipeline,
                    addRankPipeline
                ],

                global: [
                    groupPipelineCreation("Global"),
                    addEloPipeline,
                    addRankPipeline
                ]
            }
        },
        {
            $project: {
                combined: {$concatArrays: ["$byLeague", "$global"]}
            }
        },
        {$unwind: "$combined"},
        {$replaceRoot: {newRoot: "$combined"}}
    ]).toArray();

    return Object.fromEntries(result.map(document => [document._id, document.players]));
}

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
    getRank
};