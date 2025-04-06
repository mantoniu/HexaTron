const {HttpError} = require("utils/controller-utils");
const {request} = require("http");

/**
 * Deletes the profile picture of a user by sending an HTTP DELETE request to the file service API.
 *
 * @param {string} userId - The ID of the user whose profile picture is to be deleted.
 */
function deleteProfilePicture(userId) {
    const parsedUrl = new URL(process.env.FILES_URL);

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: '/profile-picture',
        method: 'DELETE',
        headers: {
            'x-user-id': userId,
            'Content-Type': 'application/json'
        }
    };

    const req = request(options);

    req.on('error', (err) =>
        console.error(`Error sending delete request for user ${userId}: ${err.message}`));

    req.end();
}

/**
 * Uploads a profile picture by forwarding the request to the file service.
 * Validates the request and handles potential errors by throwing HttpError.
 *
 * @param {Object} req - The request object containing the file in multipart form-data format.
 * @return {Promise<string>} - Resolves with the uploaded file name if successful.
 * @throws {HttpError} - Throws specific HttpErrors for invalid content type, upload failure,
 *                       invalid file service response, or connection failure.
 */
async function uploadProfilePicture(req) {
    return new Promise((resolve, reject) => {
        if (!req.headers['content-type']?.includes('multipart/form-data'))
            return reject(new HttpError(400, "Only multipart uploads are accepted"));

        const options = {
            method: "POST",
            headers: {...req.headers}
        };

        const proxyReq = request(process.env.FILES_URL + "/profile-picture", options, (proxyRes) => {
            let responseData = '';

            proxyRes.on('data', (chunk) => {
                responseData += chunk;
            });

            proxyRes.on('end', () => {
                if (proxyRes.statusCode !== 201)
                    return reject(new HttpError(proxyRes.statusCode, proxyRes.error));

                try {
                    resolve();
                } catch (error) {
                    reject(new HttpError(500, "Invalid response from file service"));
                }
            });
        });

        proxyReq.on('error', (err) => {
            reject(new HttpError(502, `Failed to connect to file service: ${err.message}`));
        });

        req.pipe(proxyReq);
    });
}

module.exports = {
    deleteProfilePicture,
    uploadProfilePicture
};