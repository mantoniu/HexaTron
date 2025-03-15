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
        const response = await this.request("POST", "api/user/refreshToken", null, this._refreshToken);
        if (response) {
            this._accessToken = response.accessToken;
            localStorage.setItem("accessToken", this._accessToken);
        }
        return response;
    }

    /**
     * Sends an HTTP request to the server.
     *
     * @param {string} method - The HTTP method (GET, POST, PATCH, DELETE).
     * @param {string} endpoint - The API endpoint.
     * @param {Object|null} body - The request body (if applicable).
     * @param {string|null} token - The authentication token.
     * @returns {Promise<Object>} The response object.
     */
    async request(method, endpoint, body = null, token = this._accessToken) {
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