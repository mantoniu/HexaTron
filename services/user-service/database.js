const {MongoClient} = require("mongodb");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {convertToID, convertToString, DATABASE_ERRORS, USER_FIELDS} = require("./utils");

const userCollection = "users";
const refreshTokenCollection = "refreshTokens";
const dbName = process.env.DB_NAME;
const uri = process.env.URI;
const client = new MongoClient(uri);
const db = client.db(dbName);
const leagueRank = {0: "Stone", 1000: "Iron", 1250: "Silver", 1500: "Gold", 1750: "Platinum", 2000: "Diamond"};
const initialELO = 1000;

const branches = Object.keys(leagueRank).reverse().map(elo => ({
    case: {$gte: ["$elo", parseInt(elo)]},
    then: leagueRank[elo]
}));

const switchOptions = {
    branches: branches,
    default: "wood"
};

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
    user.league = getLeague(user.elo);
    if (!user)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);

    return user;
}

async function getUserByName(name, excludedFields = []) {
    return getUserByFilter({name}, excludedFields);
}

async function getUserByID(id, excludedFields = []) {
    return getUserByFilter({_id: convertToID(id)}, excludedFields);
}

function generateToken(userID, access) {
    try {
        return jwt.sign(
            {userID},
            access ? process.env.ACCESS_TOKEN_SECRET : process.env.REFRESH_TOKEN_SECRET,
            {expiresIn: access ? "15m" : "7d"}
        );
    } catch (error) {
        throw new Error(DATABASE_ERRORS.TOKEN_GENERATION_FAILED);
    }
}

async function generateRefreshToken(userID) {
    const token = generateToken(userID, false);
    const result = await mongoOperation(() =>
        db.collection(refreshTokenCollection).insertOne({userID, refreshToken: token})
    );
    if (!result.acknowledged)
        throw new Error(DATABASE_ERRORS.TOKEN_INSERT_FAILED);
    return token;
}

async function deleteToken(userID) {
    const result = await mongoOperation(() =>
        db.collection(refreshTokenCollection).deleteOne({userID})
    );
    if (result.deletedCount === 0)
        throw new Error(DATABASE_ERRORS.TOKEN_NOT_FOUND);
    return true;
}

async function addUser(newUser) {
    newUser.elo = initialELO;
    const result = await mongoOperation(() =>
        db.collection(userCollection).insertOne(newUser)
    );
    const userId = convertToString(result.insertedId);
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
    return convertToString(user._id);
}

async function deleteUserByID(userID) {
    const result = await mongoOperation(() =>
        db.collection(userCollection).deleteOne({_id: convertToID(userID)})
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
    return res;
}

async function updateUser(newUserData, userID) {
    const modification = await mongoOperation(() =>
        db.collection(userCollection).updateOne(
            {_id: convertToID(userID)},
            {$set: newUserData}
        )
    );

    if (modification.matchedCount === 0)
        throw new Error(DATABASE_ERRORS.USER_NOT_FOUND);
    return await getUserByID(userID, [USER_FIELDS.password, USER_FIELDS.answers]);
}

async function refreshAccessToken(userID) {
    const refreshTokenPresent = await mongoOperation(() =>
        db.collection(refreshTokenCollection).findOne({userID})
    );
    if (!refreshTokenPresent)
        throw new Error(DATABASE_ERRORS.TOKEN_NOT_FOUND);
    return generateToken(userID, true);
}

async function resetPassword(username, answers, newPassword) {
    const userID = await getUserID(username);
    const user = await getUserByID(userID);
    if (!user.answers.every((el, i) => answers[i] === el))
        throw new Error(DATABASE_ERRORS.SECURITY_ANSWERS_MISMATCH);

    await updateUser({password: newPassword}, userID);
    return true;
}

async function getElo(players) {
    players = players.map(id => convertToID(id));
    let result = await mongoOperation(() =>
        db.collection(userCollection).find({"_id": {"$in": players}}, {projection: {_id: 1, elo: 1}}).toArray()
    );
    result.forEach(player => player._id = convertToString(player._id));
    return result;
}

async function leaderboard() {
    const result = await db.collection(userCollection).aggregate([

        {
            $facet: {
                byLeague: [
                    {
                        $addFields: {
                            league: {
                                $switch: switchOptions
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$league",
                            players: {
                                $push: {
                                    _id: "$_id",
                                    name: "$name",
                                    elo: "$elo",
                                    league: "$league"
                                }
                            }
                        }
                    },
                    {
                        $addFields: {
                            players: {
                                $sortArray: {
                                    input: "$players",
                                    sortBy: {elo: -1}
                                }
                            }
                        }
                    },
                    {
                        $addFields: {
                            players: {
                                $map: {
                                    input: "$players",
                                    as: "player",
                                    in: {
                                        _id: "$$player._id",
                                        name: "$$player.name",
                                        elo: "$$player.elo",
                                        league: "$$player.league",
                                        leagueRank: {
                                            $add: [
                                                {
                                                    $size: {
                                                        $filter: {
                                                            input: "$players",
                                                            as: "other",
                                                            cond: {$gt: ["$$other.elo", "$$player.elo"]}
                                                        }
                                                    }
                                                },
                                                1
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                ],

                global: [
                    {
                        $group: {
                            _id: "Global",
                            players: {$push: {name: "$name", elo: "$elo"}}
                        }
                    },
                    {
                        $addFields: {
                            players: {
                                $sortArray: {
                                    input: "$players",
                                    sortBy: {elo: -1}
                                }
                            }
                        }
                    },
                    {
                        $addFields: {
                            players: {
                                $map: {
                                    input: "$players",
                                    as: "player",
                                    in: {
                                        _id: "$$player._id",
                                        name: "$$player.name",
                                        elo: "$$player.elo",
                                        league: "$$player.league",
                                        leagueRank: {
                                            $add: [
                                                {
                                                    $size: {
                                                        $filter: {
                                                            input: "$players",
                                                            as: "other",
                                                            cond: {$gt: ["$$other.elo", "$$player.elo"]}
                                                        }
                                                    }
                                                },
                                                1
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
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