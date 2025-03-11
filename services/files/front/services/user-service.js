import {User} from "../js/User.js";
import {EventEmitter} from "../js/EventEmitter.js";

/**
 * Defines user-related events.
 *
 * @constant {Object}
 */
export const USER_EVENTS = Object.freeze({
    CONNECTION: "CONNECTION",
    LOGOUT: "LOGOUT"
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
    UPDATE_PASSWORD: "updatePassword",
    RESET_PASSWORD: "resetPassword",
    LOGOUT: "logout",
    DELETE: "delete"
});

/**
 * Default parameters for new users (key bindings and player colors).
 * @constant {Object}
 */
const DEFAULT_PARAMS = {
    keysPlayers: [["a", "q", "e", "d"], ["u", "j", "o", "l"]],
    playersColors: ["#ff0000", "#40ff00"]
};

/**
 * Error messages mapped to user actions and HTTP status codes.
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
    [USER_ACTIONS.DELETE]: {
        404: "The user account you are trying to delete does not exist.",
        500: "Unable to delete your account at the moment. Please try again later."
    },
    default: {
        400: "Something went wrong with your request. Please check your input and try again.",
        401: "You need to log in to perform this action.",
        403: "You do not have permission to perform this action.",
        404: "The resource you are looking for could not be found.",
        500: "We are experiencing some technical difficulties. Please try again later.",
        503: "Unable to connect to the server. Please check your internet connection and try again."
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

        if (UserService._instance) return UserService._instance;

        this._user = JSON.parse(localStorage.getItem("user")) || new User("0", "Player 1", "assets/profile.svg", DEFAULT_PARAMS);
        this._accessToken = localStorage.getItem("accessToken") || null;
        this._refreshToken = localStorage.getItem("refreshToken") || null;
        this._connected = localStorage.getItem("connected") || false;

        if (!this._connected) {
            localStorage.setItem("user", JSON.stringify(this._user));
        }

        UserService._instance = this;
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
        return ERROR_MESSAGES[action]?.[status] || ERROR_MESSAGES.default[status] || "An unknown error has occurred.";
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
        const response = await this._request("POST", endpoint, data);
        if (response.success) {
            this._setUserData(response.data);
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
            const response = await this._request("PATCH", `api/user/me`, newData);
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
     * Updates the password of the current user.
     *
     * @param {string} curPassword - The current password.
     * @param {string} newPassword - The new password to set.
     * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure.
     */
    async updatePassword(curPassword, newPassword) {
        const response = await this._request("POST", "api/user/updatePassword", {
            oldPassword: curPassword,
            newPassword
        });
        if (response.success)
            return {success: true, message: "Password successfully modified"};

        return {success: false, error: this._getErrorMessage(response.status, USER_ACTIONS.UPDATE_PASSWORD)};
    }

    /**
     * Logs out the current user.
     */
    async logout() {
        await this._request("POST", "api/user/disconnect");
        this._reset();
        this.emit(USER_EVENTS.LOGOUT);
    }

    /**
     * Deletes the current user account.
     *
     * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure.
     */
    async delete() {
        const response = await this._request("DELETE", `api/user/me`);
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
        const response = await this._request("POST", "api/user/resetPassword", {username, password, answers});
        if (response.success)
            return {success: true, message: "Password successfully reset."};

        return {success: false, error: this._getErrorMessage(response.status, USER_ACTIONS.RESET_PASSWORD)};
    }

    /**
     * Refreshes the access token using the refresh token.
     *
     * @returns {Promise<Object>} A promise that resolves to the new access token or an error.
     */
    async refreshAccessToken() {
        const response = await this._request("POST", "api/user/refreshToken", null, this._refreshToken);
        if (response) {
            this._accessToken = response.accessToken;
            localStorage.setItem("accessToken", this._accessToken);
        }
        return response;
    }

    /**
     * Sends an HTTP request to the server.
     *
     * @private
     * @param {string} method - The HTTP method (GET, POST, PATCH, DELETE).
     * @param {string} endpoint - The API endpoint.
     * @param {Object|null} body - The request body (if applicable).
     * @param {string|null} token - The authentication token.
     * @returns {Promise<Object>} The response object.
     */
    async _request(method, endpoint, body = null, token = this._accessToken) {
        const headers = {"Content-Type": "application/json"};
        if (token)
            headers["Authorization"] = `Bearer ${token}`;

        const options = {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        };

        try {
            const response = await fetch(`${window.location}${endpoint}`, options);
            const data = await response.json().catch(() => null);
            if (response.status === 498) {
                await this.refreshAccessToken();
                return this._request(method, endpoint, body, this._accessToken);
            }

            if (!response.ok)
                return {success: false, status: response.status};

            return {success: true, data};
        } catch (error) {
            if (error.name === "TypeError" || error.message === "Failed to fetch")
                return {success: false, status: 503};

            return {success: false, status: 500};
        }
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
        this._accessToken = data.accessToken;
        this._refreshToken = data.refreshToken;
        this._connected = true;
        this._saveToLocalStorage();
        this.emit(USER_EVENTS.CONNECTION);
    }

    /**
     * Saves the current user data to localStorage.
     *
     * @private
     */
    _saveToLocalStorage() {
        localStorage.setItem("user", JSON.stringify(this._user));
        localStorage.setItem("accessToken", this._accessToken);
        localStorage.setItem("refreshToken", this._refreshToken);
        localStorage.setItem("connected", this._connected);
    }

    /**
     * Clears user data from localStorage.
     *
     * @private
     */
    _clearLocalStorage() {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("connected");
    }

    /**
     * Resets the user service to its initial state.
     *
     * @private
     */
    _reset() {
        this._user = null;
        this._accessToken = null;
        this._refreshToken = null;
        this._connected = false;
        this._clearLocalStorage();
    }
}

export const userService = UserService.getInstance();