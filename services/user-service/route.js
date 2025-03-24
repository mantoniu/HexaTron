const controller = require("./controller");
const {options} = require("./api-options");
const {createServiceServer} = require("../utils/routing-utils");

const routes = [
    {
        /**
         * @swagger
         * /api/user/register:
         *   post:
         *     summary: Register a new user
         *     description: Create a new user in the database according to the values sent by the client.
         *     tags:
         *       - "User service"
         *     requestBody:
         *       description: Information about the user to register.
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *            $ref: '#/components/schemas/user'
         *     responses:
         *       201:
         *         description: The response consists of an access token, a refresh token, and the user's data, excluding the ID, password, and answers.
         *         content:
         *             application/json:
         *                 schema:
         *                   $ref: '#/components/schemas/login_register_answer'
         *                 examples:
         *                   creationExample:
         *                     $ref: '#/components/schemas/login_register_answer/examples/creationExample'
         *       409:
         *         description: Username already exists
         *       400:
         *         description: Invalid user data format
         *       500:
         *        description: Internal Server Error
         */
        method: "POST",
        path: ["register"],
        handler: controller.register,
    },
    {
        /**
         * @swagger
         * /api/user/doc:
         *   get:
         *     summary: Get the API
         *     description: Return the API documentation to the sender of the request.
         *     tags:
         *       - User service
         *     responses:
         *       200:
         *         description: The API converted to the JSON format and stringify.
         *       500:
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         *                   example: "Failed to read API documentation"
         *                 details:
         *                   type: string
         *                   example: "Error message here"
         */
        method: "GET",
        path: ["doc"],
        handler: controller.documentation
    },
    {
        /**
         * @swagger
         * /api/user/login:
         *   post:
         *     summary: Login to the game
         *     description: Login to an existing user account in the database using the username and password.
         *     tags:
         *       - User service
         *     requestBody:
         *       description: Username and password for authentication.
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *            $ref: '#/components/schemas/connection_user'
         *     responses:
         *       200:
         *         description: The response consists of an access token, a refresh token, and the user's data, excluding the ID, password, and answers.
         *         content:
         *             application/json:
         *                 schema:
         *                   $ref: '#/components/schemas/login_register_answer'
         *                 examples:
         *                   loginExample:
         *                     $ref: '#/components/schemas/login_register_answer/examples/loginExample'
         *       401:
         *         description: Invalid credentials
         *       500:
         *         description: Token generation failed or Internal Server Error
         */
        method: "POST",
        path: ["login"],
        handler: controller.login,
    },
    {
        /**
         * @swagger
         * /api/user/me:
         *   patch:
         *     summary: Modify a registered user
         *     description: Modify the name and/or parameters of a registered user with new values.
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *     requestBody:
         *       description: New name and/or parameters
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *            $ref: '#/components/schemas/returned_user'
         *           examples:
         *             nameOnly:
         *                $ref: '#/components/schemas/returned_user/examples/nameOnly'
         *             parametersOnly:
         *                $ref: '#/components/schemas/returned_user/examples/parametersOnly'
         *             nameAndParameters:
         *                $ref: '#/components/schemas/returned_user/examples/default'
         *     responses:
         *       200:
         *         description: The response consists of an access token, a refresh token, and the user's data, excluding the ID, password, and answers.
         *         content:
         *             application/json:
         *                 schema:
         *                   $ref: '#/components/schemas/update_answer'
         *       409:
         *         description: Username already exists
         *       400:
         *         description: Invalid data format
         *       404:
         *         description: User not found
         *       500:
         *        description: Internal server error during update
         */
        method: "PATCH",
        path: ["me"],
        handler: controller.update,
    },
    {
        /**
         * @swagger
         * /api/user/refreshToken:
         *   post:
         *     summary: Generate a new access token
         *     description: Generate a new access token, using the refresh token for authentication.
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *     responses:
         *       200:
         *         description: The response consists of an access token, a refresh token, and the user's data, excluding the ID, password, and answers.
         *         content:
         *             application/json:
         *                 schema:
         *                   $ref: '#/components/schemas/refreshToken'
         *       401:
         *         description: No refresh token found. Please log in again
         *       500:
         *        description: Failed to generate new access token or Internal Server Error
         */
        method: "POST",
        path: ["refreshToken"],
        handler: controller.refreshToken
    },
    {
        /**
         * @swagger
         * /api/user/resetPassword:
         *   post:
         *     summary: Reset the Password
         *     description: Replace the password of a given user with a new one.
         *     tags:
         *       - User service
         *     requestBody:
         *       description: Username and answers for authentication and a new password.
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *            $ref: '#/components/schemas/resetPassword'
         *     responses:
         *       201:
         *         description: Password has been successfully reset.
         *       401:
         *         description: Security answers do not match
         *       404:
         *         description: User not found
         *       500:
         *        description: Internal Server Error
         */
        method: "POST",
        path: ["resetPassword"],
        handler: controller.resetPassword
    },
    {
        /**
         * @swagger
         * /api/user/disconnect:
         *   post:
         *     summary: Disconnect the user
         *     description: Disconnect the user by removing the refresh token from the database.
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *     responses:
         *       204:
         *         description: User has been successfully disconnected.
         *       404:
         *         description: User was not logged in or already logged out
         *       500:
         *        description: Internal Server Error
         */
        method: "POST",
        path: ["disconnect"],
        handler: controller.disconnect
    },
    {
        /**
         * @swagger
         * /api/user/updatePassword:
         *   patch:
         *     summary: Modify the password of a user
         *     description: Modify a user's password in the database by verifying the previous password.
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *     requestBody:
         *       description: Old password and new password
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *            $ref: '#/components/schemas/newPassword'
         *     responses:
         *       200:
         *         description: Password successfully updated.
         *       400:
         *         description: Invalid password format
         *       401:
         *         description: Current password is incorrect
         *       404:
         *         description: User not found
         *       500:
         *        description: Internal server error during update
         */
        method: "POST",
        path: ["updatePassword"],
        handler: controller.updatePassword
    },
    {
        /**
         * @swagger
         * /api/user/me:
         *   delete:
         *     summary: Delete the user
         *     description: Delete the user from the database
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *     responses:
         *       204:
         *         description: User has been successfully deleted.
         *       404:
         *         description: User was not logged in or already logged out
         *       500:
         *        description: Internal Server Error
         */
        method: "DELETE",
        path: ["me"],
        handler: controller.delete
    },
    {
        /**
         * @swagger
         * /api/user/health:
         *   get:
         *     summary: Health check for Docker
         *     description: Health check to determine if the service is ready to use.
         *     tags:
         *       - User service
         *     responses:
         *       204:
         *          description: Only the http code of the response
         */
        method: "GET",
        path: ["health"],
        handler: controller.health
    },
    {
        /**
         * @swagger
         * /api/user/ELO:
         *   post:
         *     summary: Retrieve the ELO of each player
         *     description: Retrieve from the database the ELO of each user present in the body of the request.
         *     tags:
         *       - User service
         *     requestBody:
         *       description: Array of player IDs
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *            $ref: '#/components/schemas/getELO'
         *     responses:
         *       200:
         *         description: The response consists of an array, with each element containing a player ID and the corresponding ELO.
         *         content:
         *           application/json:
         *             schema:
         *                $ref: '#/components/schemas/resultELO'
         *       500:
         *        description: Internal Server Error
         */
        method: "POST",
        path: ["ELO"],
        handler: controller.getElo
    },
    {
        /**
         * @swagger
         * /api/user/leaderboard:
         *   get:
         *     summary: Retrieve the LeaderBoard
         *     description: Retrieve the leaderboard created by aggregating users' data into one document for each league according to the ELO range, and convert the result into an array.
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *     responses:
         *       200:
         *         description: The response consists of a dictionary with one element for each league, and each value is an ordered array of players with their name and ELO.
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/leaderboardResult'
         *       500:
         *         description: Internal Server Error
         */
        method: "GET",
        path: ["leaderboard"],
        handler: controller.leaderboard
    },
    {
        /**
         * @swagger
         * /friends/{friendId}:
         *   post:
         *     summary: Add a new friend for a user
         *     description: This endpoint allows a user to add a friend by sending a request to add another user as their friend.
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *       - in: path
         *         name: friendId
         *         description: The ID of the user to whom the friend request is being sent.
         *         schema:
         *           type: string
         *           example: "123"
         *     responses:
         *       200:
         *         description: Successfully added the new friend.
         *         content:
         *           application/json:
         *             schema:
         *              $ref: '#/components/schemas/addFriendAnswer'
         *       500:
         *         description: Internal server error while adding the friend.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         *                   example: Error message
         */
        method: "POST",
        path: ["friends", ":friendId"],
        handler: controller.addFriend
    },
    {
        /**
         * @swagger
         * /friends/{friendId}:
         *   patch:
         *     summary: Accept a friend request and update friendship status
         *     description: This endpoint allows a user to accept a friend request, changing the status to "friends" for both users.
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *       - in: path
         *         name: friendId
         *         description: The ID of the user whose friend request we are accepting.
         *         schema:
         *           type: string
         *           example: "123"
         *     responses:
         *       200:
         *         description: Successfully updated the friendship status.
         *         content:
         *           application/json:
         *             schema:
         *              $ref: '#/components/schemas/acceptFriendAnswer'
         *       500:
         *         description: Internal server error while accepting the friend request.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         *                   example: Error message
         */
        method: "PATCH",
        path: ["friends", ":friendId"],
        handler: controller.acceptFriend
    },
    {
        /**
         * @swagger
         * /friends/{friendId}:
         *   delete:
         *     summary: Remove a friend and delete the friendship
         *     description: This endpoint allows a user to remove a friend by deleting the friendship between the two users.
         *     tags:
         *       - User service
         *     parameters:
         *       - $ref: '#/components/parameters/AuthorizationHeader'
         *       - in: path
         *         name: friendId
         *         description: The ID of the user whom we are removing from our friends.
         *         schema:
         *           type: string
         *           example: "123"
         *     responses:
         *       200:
         *         description: Successfully removed the friend and deleted the friendship.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 message:
         *                   type: string
         *                   example: Friend successfully deleted
         *                 friendId:
         *                   type: string
         *                   example: "123"
         *       500:
         *         description: Internal server error while removing the friend.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         *                   example: Error message
         */
        method: "DELETE",
        path: ["friends", ":friendId"],
        handler: controller.removeFriend
    }
];

module.exports = createServiceServer(routes, options, process.env.USER_API);