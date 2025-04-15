import {userService} from "../services/user-service.js";
import {socketService} from "../services/socket-service.js";

/**
 * Default error messages mapped to HTTP status codes.
 *
 * @constant {Object}
 */
export const DEFAULT_ERROR_MESSAGES = Object.freeze({
    400: "Something went wrong with your request. Please check your input and try again.",
    401: "You need to log in to perform this action.",
    403: "You do not have permission to perform this action.",
    404: "The resource you are looking for could not be found.",
    500: "We are experiencing some technical difficulties. Please try again later.",
    503: "Unable to connect to the server. Please check your internet connection and try again."
});

/**
 * Class for managing API requests and tokens
 * This class implements the Singleton pattern to ensure a single instance.
 * It handles HTTP requests, token management, and automatic token refresh.
 *
 * @class ApiClient
 * @singleton
 */
export class ApiClient {
    static _instance = null;

    /**
     * Private constructor (singleton pattern).
     *
     * @private
     */
    constructor() {
        if (ApiClient._instance) return ApiClient._instance;

        this._accessToken = localStorage.getItem("accessToken") || null;
        this._refreshToken = localStorage.getItem("refreshToken") || null;
        this._refreshingPromise = null;

        ApiClient._instance = this;
    }

    /**
     * Retrieves the singleton instance of ApiClient.
     *
     * @returns {ApiClient} The singleton instance.
     */
    static getInstance() {
        if (!ApiClient._instance) {
            ApiClient._instance = new ApiClient();
        }
        return ApiClient._instance;
    }

    /**
     * Refreshes the access token using the refresh token.
     *
     * @returns {Promise<Object>} A promise that resolves to the new access token or an error.
     */
    async refreshAccessToken() {
        if (this._refreshingPromise)
            return this._refreshingPromise;

        this._refreshingPromise = (async () => {
            const response = await this.request("POST", "api/user/refresh-token", null, this._refreshToken, true, true);
            if (response?.success) {
                this._accessToken = response.data.accessToken;
                localStorage.setItem("accessToken", this._accessToken);
            }
            this._refreshingPromise = null;
            return response;
        })();

        return this._refreshingPromise;
    }

    /**
     * Sends an HTTP request to the server.
     *
     * @param {string} method - The HTTP method (GET, POST, PATCH, DELETE).
     * @param {string} endpoint - The API endpoint.
     * @param {Object|null} body - The request body (if applicable).
     * @param {string|null} token - The authentication token.
     * @param {boolean} [asJson=true] - Whether to send the body as JSON. If false, assumes body is already in the correct format (e.g., FormData).
     * @returns {Promise<Object>} The response object.
     */
    async request(method, endpoint, body = null, token = null, asJson = true, refresh = false) {
        token = token ?? this._accessToken;

        const headers = {};

        if (token)
            headers["Authorization"] = `Bearer ${token}`;

        if (asJson) {
            headers["Content-Type"] = "application/json";
            body = body ? JSON.stringify(body) : null;
        }

        const options = {
            method,
            headers,
            body
        };

        try {
            const response = await fetch(`${window.location.origin}/${endpoint}`, options);
            const data = await response.json().catch(() => null);
            if (response.status === 498) {
                const response = await this.refreshAccessToken();
                if (response.success)
                    return this.request(method, endpoint, body, this._accessToken, asJson);
            } else if (refresh && response.status === 401) {
                await userService._reset();
                socketService.disconnectAll();
                return;
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
     * Sets the access and refresh tokens.
     *
     * @param {string} accessToken - The access token to set.
     * @param {string} refreshToken - The refresh token to set.
     */
    setTokens(accessToken, refreshToken) {
        this._accessToken = accessToken;
        this._refreshToken = refreshToken;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
    }

    /**
     * Clears the access and refresh tokens from memory and localStorage.
     */
    clearTokens() {
        this._accessToken = null;
        this._refreshToken = null;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    }
}

export const apiClient = ApiClient.getInstance();