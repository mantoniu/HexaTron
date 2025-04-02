const {
    removeFriend, addFriend, acceptFriend, addUser, deleteToken, generateToken, generateRefreshToken, checkPassword, updateUser, resetPassword,
    refreshAccessToken, deleteUserByID, getElo, leaderboard, getRank, getUserByID, getFriendStatus
} = require("./database");
const {getIDInRequest, HttpError, NOTIFICATION_TYPE, sendNotification} = require("../utils/controller-utils");
const bcrypt = require("bcrypt");
const {DATABASE_ERRORS, USER_FIELDS} = require("./utils");
const {readData} = require("../utils/api-utils");
const {parse} = require("url");
const eventBus = require("./event-bus");
const {ObjectId} = require("mongodb");
const saltRounds = 10;

/**
 * Hashes a password using bcrypt with a generated salt.
 *
 * @param {string} password - The plain text password to be hashed.
 * @return {Promise<string>} - A promise that resolves to the hashed password.
 * @throws {HttpError} - Throws an error with status 500 if hashing fails.
 */
async function hashPassword(password) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new HttpError(500, error.message);
    }
}

/**
 * Notifies all friends of a user when user's information are updated.
 *
 * @param {string} id - The ID of the user whose data has been modified.
 */
async function notifyFriendOfEvent(id) {
    const {friends, ...user} = await getUserByID(id, [USER_FIELDS.parameters, USER_FIELDS.answers, USER_FIELDS.password]);
    for (const friend in friends) {
        const status = await getFriendStatus(new ObjectId(id), new ObjectId(friend));
        const friendData = {id: user._id, friendData: {...user, status: status}};
        eventBus.emit("update-status-friends", {friendId: friend, friendFriends: friendData});
    }
}

/**
 * Registers a new user by hashing the password and saving the user's data in the database.
 * It also generates access and refresh tokens for the user.
 *
 * @param {Object} req - The request object containing the user's data in the body.
 * @param {Object} res - The response object used to send back the registration result.
 * @return {Promise<void>} - Sends a response with the status of the registration process.
 * @throws {HttpError} - Throws specific HttpErrors based on different failure scenarios.
 */
exports.register = async (req, res) => {
    try {
        const userData = req.body;
        userData.password = await hashPassword(userData.password);
        const {accessToken, refreshToken, user} = await addUser(userData);

        res.writeHead(201, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            message: "User successfully registered.",
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken
        }));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        if (error.message === DATABASE_ERRORS.USERNAME_ALREADY_EXISTS)
            throw new HttpError(409, "Username already exists");
        if (error.message === DATABASE_ERRORS.VALIDATION_FAILED)
            throw new HttpError(400, "Invalid user data format");

        throw new HttpError(500, error.message);
    }
};

/**
 * Authenticates a user by verifying their credentials and generating access and refresh tokens.
 *
 * @param {Object} req - The request object containing the user's credentials in the body.
 * @param {Object} res - The response object used to send back the login result.
 * @return {Promise<void>} - Sends a response with the status of the login process, including the user data and tokens.
 * @throws {HttpError} - Throws specific HttpErrors based on different failure scenarios (invalid credentials, token generation issues).
 */
exports.login = async (req, res) => {
    try {
        const credentials = req.body;
        const user = await checkPassword(credentials.name, credentials.password, false);
        const accessToken = generateToken(user._id, true);
        const refreshToken = await generateRefreshToken(user._id);

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            message: "User successfully logged in.",
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken
        }));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        if (error.message === DATABASE_ERRORS.USER_NOT_FOUND || error.message === DATABASE_ERRORS.INVALID_PASSWORD)
            throw new HttpError(401, "Invalid credentials");

        if (error.message === DATABASE_ERRORS.TOKEN_GENERATION_FAILED ||
            error.message === DATABASE_ERRORS.TOKEN_INSERT_FAILED)
            throw new HttpError(500, "Token generation failed");

        throw new HttpError(500, error.message);
    }
};

/**
 * Updates an existing user's data based on the provided request body.
 * The user ID is extracted from the request to identify the user to be updated.
 *
 * @param {Object} req - The request object containing the new user data in the body.
 * @param {Object} res - The response object used to send back the update result.
 * @return {Promise<void>} - Sends a response with the status of the update process, including the updated user data.
 * @throws {HttpError} - Throws specific HttpErrors based on different failure scenarios (user not found, validation errors, etc.).
 */
exports.update = async (req, res) => {
    try {
        const userID = getIDInRequest(req);
        const userData = await updateUser(req.body, userID);
        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({message: "User successfully updated.", user: userData}));
        await notifyFriendOfEvent(userID, true);
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        if (error.message === DATABASE_ERRORS.USERNAME_ALREADY_EXISTS)
            throw new HttpError(409, "Username already exists");
        if (error.message === DATABASE_ERRORS.USER_NOT_FOUND)
            throw new HttpError(404, "User not found");
        if (error.message === DATABASE_ERRORS.VALIDATION_FAILED)
            throw new HttpError(400, "Invalid data format");

        throw new HttpError(500, "Internal server error during update");
    }
};

/**
 * Updates a user's password by verifying the current password and setting a new one.
 * The new password is hashed before being saved.
 *
 * @param {Object} req - The request object containing the user's old and new passwords in the body.
 * @param {Object} res - The response object used to send back the update result.
 * @return {Promise<void>} - Sends a response with the status of the password update.
 * @throws {HttpError} - Throws specific HttpErrors based on different failure scenarios (incorrect current password, user not found, invalid format).
 */
exports.updatePassword = async (req, res) => {
    try {
        const userID = getIDInRequest(req);
        const credential = req.body;

        await checkPassword(userID, credential.oldPassword, true);
        credential.newPassword = await hashPassword(credential.newPassword);
        await updateUser({password: credential.newPassword}, userID);

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({message: "Password successfully updated."}));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        if (error.message === DATABASE_ERRORS.INVALID_PASSWORD)
            throw new HttpError(401, "Current password is incorrect");
        if (error.message === DATABASE_ERRORS.USER_NOT_FOUND)
            throw new HttpError(404, "User not found");
        if (error.message === DATABASE_ERRORS.VALIDATION_FAILED)
            throw new HttpError(400, "Invalid password format");

        throw new HttpError(500, error.message);
    }
};

/**
 * Resets a user's password after verifying the security answers.
 * The new password is hashed before being updated in the database.
 *
 * @param {Object} req - The request object containing the user's username, security answers, and new password.
 * @param {Object} res - The response object used to send back the result of the password reset operation.
 * @return {Promise<void>} - Sends a response indicating the status of the password reset.
 * @throws {HttpError} - Throws specific HttpErrors based on different failure scenarios (mismatched security answers, user not found).
 */
exports.resetPassword = async (req, res) => {
    try {
        let {username, answers, password} = req.body;
        password = await hashPassword(password);

        await resetPassword(username, answers, password);
        res.writeHead(201, {"Content-Type": "application/json"});
        res.end(JSON.stringify({message: "Password has been successfully reset."}));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        if (error.message === DATABASE_ERRORS.SECURITY_ANSWERS_MISMATCH)
            throw new HttpError(401, "Security answers do not match");
        if (error.message === DATABASE_ERRORS.USER_NOT_FOUND)
            throw new HttpError(404, "User not found");

        throw new HttpError(500, error.message);
    }
};

/**
 * Generates a new access token using the refresh token associated with the user.
 * The refresh token is used to authenticate the request and generate a new access token.
 *
 * @param {Object} req - The request object containing the refresh token in the user's session or request.
 * @param {Object} res - The response object used to send back the new access token.
 * @return {Promise<void>} - Sends a response containing the new access token.
 * @throws {HttpError} - Throws specific HttpErrors based on different failure scenarios (missing refresh token, token generation failure).
 */
exports.refreshToken = async (req, res) => {
    try {
        const token = await refreshAccessToken(getIDInRequest(req));

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({message: "New access token generated successfully.", accessToken: token}));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;

        if (error.message === DATABASE_ERRORS.TOKEN_NOT_FOUND)
            throw new HttpError(401, "No refresh token found. Please log in again");
        if (error.message === DATABASE_ERRORS.TOKEN_GENERATION_FAILED)
            throw new HttpError(500, "Failed to generate new access token");

        throw new HttpError(500, error.message);
    }
};

/**
 * Disconnects a user by deleting their refresh token.
 *
 * @param {Object} req - The request object containing the user ID in the request.
 * @param {Object} res - The response object used to send back the disconnection result.
 * @return {Promise<void>} - Sends a response indicating that the user has been successfully logged out.
 * @throws {HttpError} - Throws specific HttpErrors based on different failure scenarios (user not logged in, token deletion failure).
 */
exports.disconnect = async (req, res) => {
    try {
        const userID = getIDInRequest(req);
        await deleteToken(userID);

        res.writeHead(204, {"Content-Type": "application/json"});
        res.end(JSON.stringify({message: "User has been successfully disconnected."}));
    } catch (error) {
        if (error instanceof HttpError)
            throw error;
        if (error.message === DATABASE_ERRORS.TOKEN_NOT_FOUND)
            throw new HttpError(404, "User was not logged in or already logged out");
        throw new HttpError(500, error.message);
    }
};

/**
 * Deletes a user from the system by their user ID.
 * The user data is permanently removed from the database.
 * Notify all users who have the deleted user in their friends field
 *
 * @param {Object} req - The request object containing the user ID.
 * @param {Object} res - The response object used to send back the deletion result.
 * @return {Promise<void>} - Sends a response indicating that the user has been successfully deleted.
 * @throws {HttpError} - Throws specific HttpErrors based on different failure scenarios (user not found).
 */
exports.delete = async (req, res) => {
    try {
        const userID = getIDInRequest(req);
        await deleteUserByID(userID);
        res.writeHead(204, {"Content-Type": "application/json"});
        res.end(JSON.stringify({message: "User has been successfully deleted."}));
        eventBus.emit("delete-user", userID);
    } catch (error) {
        if (error.message === DATABASE_ERRORS.USER_NOT_FOUND)
            throw new HttpError(404, "User not found");

        throw new HttpError(500, error.message);
    }
};

/**
 * Health check to ensure that the service is accessible and functioning.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send back the health check result.
 * @return {Promise<void>} - Sends a 204 No Content response to indicate the service is healthy.
 */
exports.health = async (req, res) => {
    res.writeHead(204);
    res.end();
};

/**
 * Serves the API documentation by reading the data from a specified file.
 * The documentation is returned as a JSON response.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object used to send the API documentation.
 * @return {Promise<void>} - Sends a JSON response containing the API documentation.
 * @throws {HttpError} - Throws an error response if there is an issue reading the documentation file.
 */
exports.documentation = async (req, res) => {
    try {
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        res.end(readData(process.env.USER_API));
    } catch (error) {
        res.writeHead(500, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            error: "Failed to read API documentation",
            details: error.message
        }));
    }
};

/**
 * Retrieves the ELO ratings for the specified players.
 * The ELO ratings are fetched based on the provided player data.
 *
 * @param {Object} req - The request object containing the necessary data to fetch players' ELO ratings.
 * @param {Object} res - The response object used to send back the ELO ratings.
 * @return {Promise<void>} - Sends a JSON response containing the players' ELO ratings.
 * @throws {HttpError} - Throws an error if the ELO ratings cannot be retrieved or an issue occurs during the process.
 */
exports.getElo = async (req, res) => {
    try {
        const playersELO = await getElo(req.body);
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });
        res.end(JSON.stringify({message: "Successfully recover ELO of each player", playersELO: playersELO}));
    } catch (error) {
        throw new HttpError(500, error.message);
    }
};

/**
 * Retrieves the leaderboard, including players' ELO rankings, and optionally returns the rank of a specific player.
 *
 * If an `id` query parameter is provided, the function also retrieves the rank of that specific player
 * both in their league and globally, based on their ELO score.
 *
 * @param {Object} req - The HTTP request object, which can include a query parameter for a specific player's ID.
 * @param {Object} res - The HTTP response object, used to return the leaderboard and rank details.
 * @return {void} - Sends the leaderboard data in JSON format, along with the rank of the player if specified.
 * @throws {HttpError} - Throws an error with status 500 if the operation fails.
 */
exports.leaderboard = async (req, res) => {
    try {
        const playersRanking = await leaderboard();
        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        });

        const parsedUrl = parse(req.url, true);

        if (parsedUrl.query.id) {
            const rank = await getRank(parsedUrl.query.id);
            res.end(JSON.stringify({message: "Successfully recover the leaderboard", playersELO: playersRanking, rank: rank}));
        } else {
            res.end(JSON.stringify({message: "Successfully recover the leaderboard", playersELO: playersRanking}));
        }
    } catch (error) {
        throw new HttpError(500, error.message);
    }
};

/**
 * Handles the process of adding a new friend for a user.
 *
 * This function extracts the user ID from the request, processes the addition of a friend
 * by calling the `addFriend` function, and returns a success message along with the updated friendship details.
 * It also emits an event to update the friend's status.
 *
 * @param {Object} req - The HTTP request object, containing the user and friend's IDs.
 * @param {Object} res - The HTTP response object, used to send the response back to the client.
 * @return {void} - Sends a JSON response with a success message and the updated friendship details.
 * @throws {HttpError} - Throws an error with status 500 if an issue occurs while adding the friend.
 */
exports.addFriend = async (req, res) => {
    const userId = getIDInRequest(req);
    const friendId = parse(req.url, true).pathname.split("/")?.[4];
    try {
        const result = await addFriend(userId, friendId);
        res.end(JSON.stringify({message: "New friend successfully added", friends: result.userFriends}));
        eventBus.emit("update-status-friends", {friendId: friendId, friendFriends: result.friend});
        await sendNotification(friendId, NOTIFICATION_TYPE.FRIEND_REQUEST, [userId]);
    } catch (error) {
        throw new HttpError(500, error.message);
    }
};

/**
 * Accepts a friend request, updating the friendship status to "friend" for both users.
 *
 * This function extracts the user ID and the friend ID from the request, then processes the acceptance
 * of the friend request by calling the `acceptFriend` function. Upon success, it returns a success message
 * and the updated friendship details. It also emits an event to update the friend's status.
 *
 * @param {Object} req - The HTTP request object, containing the user and friend's IDs.
 * @param {Object} res - The HTTP response object, used to send the response back to the client.
 * @return {void} - Sends a JSON response with a success message and the updated friendship details.
 * @throws {HttpError} - Throws an error with status 500 if an issue occurs while accepting the friend request.
 */
exports.acceptFriend = async (req, res) => {
    const userId = getIDInRequest(req);
    const friendId = parse(req.url, true).pathname.split("/")?.[4];
    try {
        const result = await acceptFriend(userId, friendId);
        res.end(JSON.stringify({message: "Friend status successfully updated", friends: result.userFriends}));
        eventBus.emit("update-status-friends", {friendId: friendId, friendFriends: result.friend});
        await sendNotification(friendId, NOTIFICATION_TYPE.FRIEND_ACCEPT, [userId]);
    } catch (error) {
        throw new HttpError(500, error.message);
    }
};

/**
 * Removes a friend by deleting the friendship between two users.
 *
 * This function extracts the user ID and the friend ID from the request, then processes the removal of the
 * friend by calling the `removeFriend` function. Upon success, it returns a success message and the friend ID
 * of the removed user. Additionally, it emits an event to notify that the friendship has been deleted.
 *
 * @param {Object} req - The HTTP request object, containing the user and friend's IDs.
 * @param {Object} res - The HTTP response object, used to send the response back to the client.
 * @return {void} - Sends a JSON response with a success message and the friend ID of the removed friend.
 * @throws {HttpError} - Throws an error with status 500 if an issue occurs while removing the friend.
 */
exports.removeFriend = async (req, res) => {
    const userId = getIDInRequest(req);
    const friendId = parse(req.url, true).pathname.split("/")?.[4];
    try {
        await removeFriend(userId, friendId);
        res.end(JSON.stringify({message: "Friend successfully deleted", friendId: friendId}));
        eventBus.emit("remove-friend", {userId: userId, friendId: friendId});
        await sendNotification(friendId, NOTIFICATION_TYPE.FRIEND_DELETION, [userId]);
    } catch (error) {
        throw new HttpError(500, error.message);
    }
};