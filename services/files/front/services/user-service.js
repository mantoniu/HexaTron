import {User} from "../js/User.js";
import {EventEmitter} from "../js/EventEmitter.js";
import {apiClient, DEFAULT_ERROR_MESSAGES} from "../js/ApiClient.js";
import {socketService} from "./socket-service.js";

/**
 * Defines user-related events.
 *
 * @constant {Object}
 */
export const USER_EVENTS = Object.freeze({
    CONNECTION: "CONNECTION",
    LOGOUT: "LOGOUT",
    UPDATE_FRIEND: "UPDATE_FRIEND",
    REMOVE_FRIEND: "REMOVE_FRIEND",
    SEARCH_RESULT: "SEARCH_RESULT",
    DELETE_USER: "DELETE_USER"
});

/**
 * Defines available user actions.
 *
 * @constant {Object}
 */
export const USER_ACTIONS = Object.freeze({
    LOGIN: "login",
    REGISTER: "register",
    UPDATE_USERNAME: "editUsername",
    UPDATE_PROFILE_PICTURE: "updateProfilePicture",
    UPDATE_PASSWORD: "updatePassword",
    RESET_PASSWORD: "resetPassword",
    LOGOUT: "logout",
    DELETE: "delete"
});

/**
 * Default parameters for new users (key bindings and player colors).
 *
 * @constant {Object}
 */
const DEFAULT_PARAMS = {
    keysPlayers: [["a", "q", "e", "d"], ["u", "j", "o", "l"]],
    playersColors: ["#ff0000", "#40ff00"]
};

/**
 * Error messages mapped to user actions and HTTP status codes.
 *
 * @constant {Object}
 */
const ERROR_MESSAGES = {
    [USER_ACTIONS.LOGIN]: {
        400: "Invalid login credentials.",
        401: "Incorrect password or account does not exist.",
        500: "Unable to log in at the moment. Please try again later."
    },
    [USER_ACTIONS.REGISTER]: {
        409: "This username is already taken. Please choose a different one.",
        500: "Unable to register at the moment. Please try again later."
    },
    [USER_ACTIONS.UPDATE_USERNAME]: {
        409: "This username is already taken. Please choose a different one.",
        500: "Unable to change the username at the moment. Please try again later."
    },
    [USER_ACTIONS.UPDATE_PASSWORD]: {
        401: "The current password is incorrect. Please try again.",
        500: "Unable to update the password at the moment. Please try again later."
    },
    [USER_ACTIONS.RESET_PASSWORD]: {
        401: "The security answers provided are incorrect. Please try again.",
        404: "No account found with the provided username."
    },
    [USER_ACTIONS.UPDATE_PROFILE_PICTURE]: {
        500: "Unable to update the profile picture. Please try again later"
    },
    [USER_ACTIONS.DELETE]: {
        404: "The user account you are trying to delete does not exist.",
        500: "Unable to delete your account at the moment. Please try again later."
    }
};

/**
 * Service for managing users
 * This class implements the Singleton pattern to ensure a single instance.
 * It extends EventEmitter to handle user-related events.
 *
 * @class UserService
 * @extends EventEmitter
 * @singleton
 */
class UserService extends EventEmitter {
    static _instance = null;

    /**
     * Creates an instance of UserService or returns the existing instance.
     */
    constructor() {
        super();

        if (UserService._instance)
            return UserService._instance;

        this._user = JSON.parse(localStorage.getItem("user")) || new User("0", "Player 1", "assets/profile.svg", DEFAULT_PARAMS, []);
        this._connected = localStorage.getItem("connected") || false;

        if (!this._connected) {
            localStorage.setItem("user", JSON.stringify(this._user));
        } else {
            this._socket = socketService.connectFriendSocket();
            this._setupFriendSocketListeners();
        }

        UserService._instance = this;
    }

    /**
     * Gets the socket connection for the user.
     *
     * @returns {Socket} The socket instance.
     */
    get socket() {
        return this._socket;
    }

    set socket(socket) {
        this._socket = socket;
    }

    /**
     * Gets the current user or a guest user.
     *
     * @returns {User}
     */
    get user() {
        return this._user;
    }

    /**
     * Retrieves the singleton instance of UserService.
     *
     * @returns {UserService}
     */
    static getInstance() {
        if (!UserService._instance) {
            UserService._instance = new UserService();
        }
        return UserService._instance;
    }

    /**
     * Checks if a user is currently connected.
     *
     * @returns {boolean}
     */
    isConnected() {
        return this._connected;
    }

    /**
     * Retrieves an error message based on HTTP status and action type.
     *
     * @private
     * @param {number} status - The HTTP status code.
     * @param {string} action - The user action being performed.
     * @returns {string} The corresponding error message.
     */
    _getErrorMessage(status, action) {
        return ERROR_MESSAGES[action]?.[status] || DEFAULT_ERROR_MESSAGES[status] || "An unknown error has occurred.";
    }

    /**
     * Registers a new user.
     *
     * @param {Object} data - User registration data.
     * @returns {Promise<Object>}
     */
    async register(data) {
        data.parameters = this._user.parameters;
        return this._authenticate("api/user/register", data, USER_ACTIONS.REGISTER);
    }

    /**
     * Logs in a user.
     *
     * @param {Object} data - User login data.
     * @returns {Promise<Object>}
     */
    async login(data) {
        return this._authenticate("api/user/login", data, USER_ACTIONS.LOGIN);
    }

    /**
     * Handles authentication for login and registration.
     *
     * @private
     * @param {string} endpoint - The API endpoint.
     * @param {Object} data - The request body.
     * @param {string} action - The action being performed.
     * @returns {Promise<Object>} The authentication result.
     */
    async _authenticate(endpoint, data, action) {
        const response = await apiClient.request("POST", endpoint, data);
        if (response.success) {
            this._setUserData(response.data);
            this.emit(USER_EVENTS.CONNECTION);
            this._socket = socketService.connectFriendSocket();
            this._setupFriendSocketListeners();
            return {success: true, user: this._user};
        }
        return {success: false, error: this._getErrorMessage(response.status, action)};
    }

    /**
     * Updates the current user.
     *
     * @param {Object} newData - The new data to set.
     * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure.
     */
    async updateUser(newData) {
        if (this.isConnected()) {
            const response = await apiClient.request("PATCH", `api/user/me`, newData);

            if (response.success) {
                const data = response.data;

                this._user = data.user;
                localStorage.setItem("user", JSON.stringify(this._user));
                return {success: true, ...newData};
            }
            return {success: false, error: this._getErrorMessage(response.status, USER_ACTIONS.UPDATE_USERNAME)};
        } else {
            Object.entries(newData).forEach(([key, value]) => this._user[key] = value);
            localStorage.setItem("user", JSON.stringify(this._user));
        }
    }

    /**
     * Updates the user's profile picture.
     * Sends the new profile picture file to the backend for processing, and updates the user's profile with the new image.
     *
     * @param {File} file - The new profile picture file to be uploaded. It should be a valid image file (e.g., JPEG, PNG, GIF).
     *
     * @returns {Promise<Object>} A promise that resolves to an object indicating the success or failure of the operation:
     * - If successful: `{ success: true, profilePicture: "newImageFilePath" }`
     * - If failed: `{ success: false, error: "Error message" }`
     */
    async updateProfilePicture(file) {
        const formData = new FormData();
        formData.append("profile_picture", file);

        const response = await apiClient.request("PATCH", "api/user/me/profile-picture", formData);
        if (response.success)
            return {success: true};

        return {success: false, error: this._getErrorMessage(response.status, USER_ACTIONS.UPDATE_PROFILE_PICTURE)};
    }

    /**
     * Updates the password of the current user.
     *
     * @param {string} curPassword - The current password.
     * @param {string} newPassword - The new password to set.
     * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure.
     */
    async updatePassword(curPassword, newPassword) {
        const response = await apiClient.request("POST", "api/user/update-password", {
            oldPassword: curPassword,
            newPassword
        });
        if (response.success)
            return {success: true, message: "Password successfully modified"};

        return {success: false, error: this._getErrorMessage(response.status, USER_ACTIONS.UPDATE_PASSWORD)};
    }

    /**
     * Updates the user's ELO rating and league, then stores the updated information in localStorage.
     *
     * @param {Object} data - The new ranking data.
     * @param {number} data.elo - The user's new ELO rating.
     * @param {string} data.league - The user's new league.
     */
    updateELO(data) {
        this.user.elo = data.elo;
        this.user.league = data.league;
        localStorage.setItem("user", JSON.stringify(this.user));
    }

    /**
     * Fetches the leaderboard data from the API.
     * If the user is connected and has an ID, it includes the user ID in the request.
     *
     * @returns {Promise<Object>} A promise resolving to the leaderboard data.
     */
    async getLeaderboard() {
        let url = "api/user/leaderboard";
        if (this.isConnected() && this.user?._id) {
            url += `?id=${this.user?._id}`;
        }
        const response = await apiClient.request("GET", url);
        return response.data;
    }

    /**
     * Logs out the current user.
     */
    async logout() {
        await apiClient.request("POST", "api/user/disconnect");

        this._reset();
        this.emit(USER_EVENTS.LOGOUT);
    }

    /**
     * Deletes the current user account.
     *
     * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure.
     */
    async delete() {
        const response = await apiClient.request("DELETE", `api/user/me`);
        if (response.success) {
            this._reset();
            return {success: true, message: "User successfully deleted."};
        }

        return {success: false, error: this._getErrorMessage(response.status, USER_ACTIONS.DELETE)};
    }

    /**
     * Resets the password for a user account.
     *
     * @param {string} username - The username of the account for which the password is being reset.
     * @param {string} password - The new password to set for the account.
     * @param {Array<string>} answers - An array of security answers to verify the user's identity.
     * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure.
     */
    async resetPassword(username, password, answers) {
        const response = await apiClient.request("POST", "api/user/reset-password", {username, password, answers});
        if (response.success)
            return {success: true, message: "Password successfully reset."};

        return {success: false, error: this._getErrorMessage(response.status, USER_ACTIONS.RESET_PASSWORD)};
    }

    /**
     * Adds a new friend to the user's friend list.
     *
     * This function sends a POST request to the backend to add a friend by their ID. If the request is successful,
     * it updates the user's friend list in the local storage.
     * If the request fails, it logs an error message based on the response status.
     *
     * @param {string} friendId - The unique identifier of the friend to be added.
     * @returns {Object} - Returns an object indicating the success or failure of the operation.
     *                     - If successful: `{ success: true, message: "New friend successfully added." }`
     *                     - If failed: `{ success: false, error: "Error message" }`
     */
    async addFriend(friendId) {
        const response = await apiClient.request("POST", `api/user/friends/${friendId}`);
        if (response.success) {
            this.user.friends[response.data.friends.id] = response.data.friends.friendData;
            this._saveToLocalStorage();
            this.emit(USER_EVENTS.UPDATE_FRIEND, {id: friendId, friendData: this.user.friends[response.data.friends.id]});
        } else {
            console.log("Error during the addition of a friend.");
        }
    }

    /**
     * Accepts a friend request and updates the user's friend list.
     *
     * This function sends a PATCH request to the backend to accept a friend request by the provided friend's ID.
     * If the request is successful, it updates the user's friend list in the local storage with the new friend's data.
     * If the request fails, it logs an error message based on the response status.
     *
     * @param {string} friendId - The unique identifier of the friend whose request is being accepted.
     * @returns {Object} - Returns an object indicating the success or failure of the operation.
     *                     - If successful: `{ success: true, message: "New friend successfully accepted." }`
     *                     - If failed: `{ success: false, error: "Error message" }`
     */
    async acceptFriend(friendId) {
        const response = await apiClient.request("PATCH", `api/user/friends/${friendId}`);
        if (response.success) {
            this.user.friends[response.data.friends.id] = response.data.friends.friendData;
            this._saveToLocalStorage();
            this.emit(USER_EVENTS.UPDATE_FRIEND, {id: friendId, friendData: this.user.friends[response.data.friends.id]});
        } else {
            console.log("Error during the friend request acceptance.");
        }
    }

    /**
     * Removes a friend from the user's friend list.
     *
     * This function sends a DELETE request to the backend to remove a friend by their unique friend ID.
     * If the request is successful, it updates the user's friend list by removing the specified friend's data.
     * If the request fails, it logs an error message based on the response status.
     *
     * @param {string} friendId - The unique identifier of the friend to be removed from the user's friend list.
     * @returns {Object} - Returns an object indicating the success or failure of the operation.
     *                     - If successful: `{ success: true, message: "Friend successfully deleted." }`
     *                     - If failed: `{ success: false, error: "Error message" }`
     */
    async removeFriend(friendId) {
        const response = await apiClient.request("DELETE", `api/user/friends/${friendId}`);
        if (response.success) {
            const friendData = this.user.friends[response.data.friendId];
            delete this.user.friends[response.data.friendId];
            this._saveToLocalStorage();
            this.emit(USER_EVENTS.REMOVE_FRIEND, {id: friendId, friendData: friendData});
        } else {
            console.log("Error during the deletion of the friend");
        }
    }

    /**
     * Searches for friends based on the given query and emits the query to the server.
     * @param {string} query - The search query to find friends.
     */
    searchFriends(query) {
        this.socket.emit("searchFriends", query);
    }

    /**
     * Sets user data after a successful authentication.
     * This includes the user object, access token, and refresh token.
     * The data is also saved to localStorage.
     *
     * @private
     * @param {Object} data - The user data to set.
     */
    _setUserData(data) {
        this._user = data.user;
        apiClient.setTokens(data.accessToken, data.refreshToken);
        this._connected = true;
        this._saveToLocalStorage();
    }

    /**
     * Saves the current user data to localStorage.
     *
     * @private
     */
    _saveToLocalStorage() {
        localStorage.setItem("user", JSON.stringify(this._user));
        localStorage.setItem("connected", this._connected);
    }

    /**
     * Clears user data from localStorage.
     *
     * @private
     */
    _clearLocalStorage() {
        localStorage.removeItem("user");
        localStorage.removeItem("connected");
    }

    /**
     * Resets the user service to its initial state.
     *
     * @private
     */
    _reset() {
        this._user = null;
        this._connected = false;
        this._clearLocalStorage();
        apiClient.clearTokens();
    }

    /**
     * Sets up the socket event listeners for friend updates and deletions.
     *
     * This function listens for two socket events:
     * 1. **"update-status-friends"**: When a friend's status is updated, the event handler updates the user's
     *    friend list with the new friend data and emits a custom "updateFriends" event to notify the app of the update.
     * 2. **"delete-friends"**: When a friend is deleted, the event handler removes the friend from the user's friend list
     *    and emits a custom "deleteFriend" event with the friend's ID and their data to notify the app of the removal.
     * It also saves the updated friend list to local storage after each event.
     */
    _setupFriendSocketListeners() {
        this.socket.on("update-status-friends", (friends) => {
            this.user.friends[friends.id] = friends.friendData;
            this._saveToLocalStorage();
            this.emit(USER_EVENTS.UPDATE_FRIEND, friends);
        });

        this.socket.on("remove-friend", (friendId) => {
            const friendData = this.user.friends[friendId];
            delete this.user.friends[friendId];
            this._saveToLocalStorage();
            this.emit(USER_EVENTS.REMOVE_FRIEND, {id: friendId, friendData: friendData});
        });

        this.socket.on("delete-user", (userId) => {
            if (userId === this.user._id) {
                alert("The user has been deleted");
                window.location.href = "/";
                this._reset();
            }

            delete this.user.friends[userId];
            this._saveToLocalStorage();
            this.emit(USER_EVENTS.DELETE_USER, {id: userId});
        });

        this.socket.on("searchFriendsResults", (searchResult) => {
            this.emit(USER_EVENTS.SEARCH_RESULT, searchResult);
        });
    }
}

export const userService = UserService.getInstance();