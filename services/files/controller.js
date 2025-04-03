const fs = require('fs');
const {join} = require('path');

const STORAGE_DIR = 'storage';
const PROFILE_PICTURE_DIR = 'profile-pictures';
const JSON_API_PATH = './front/api.json';

createDir(STORAGE_DIR);

/**
 * Creates a directory if it does not already exist.
 *
 * @param {string} dirName - The name of the directory to create.
 * @returns {void}
 */
function createDir(dirName) {
    if (!fs.existsSync(dirName))
        fs.mkdirSync(dirName, {recursive: true});
}

/**
 * Sends a response to the client with a given status and data.
 *
 * @param {ServerResponse} res - The HTTP response object.
 * @param {number} status - The HTTP status code to send.
 * @param {Object} data - The data to send in the response body.
 * @returns {void}
 */
function sendResponse(res, status, data) {
    res.writeHead(status, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(data));
}

/**
 * Deletes a user's profile picture from the server.
 * Returns a promise that resolves when the deletion process is complete.
 *
 * @param {string} userId - The ID of the user whose profile picture should be deleted.
 * @param {NodeJS.ServerResponse|null} [response=null] - The HTTP response object. If provided, the response will be sent after deletion.
 * @returns {Promise<void>} Resolves when the deletion is complete, or when an error occurs.
 */
function deleteUserProfilePicture(userId, response = null) {
    return new Promise((resolve, _) => {
        const uploadDir = join(STORAGE_DIR, PROFILE_PICTURE_DIR);

        fs.readdir(uploadDir, (err, files) => {
            if (err) {
                console.error("Error reading upload directory:", err);
                if (response)
                    sendResponse(response, 500, {error: "Server error"});
                return resolve();
            }

            const userFile = files.find(file => file.includes(userId));

            if (!userFile) {
                console.log(`No profile picture found for user: ${userId}`);
                if (response)
                    sendResponse(response, 404, {error: "Profile picture not found"});
                return resolve();
            }

            if (userFile) {
                const oldFilePath = join(uploadDir, userFile);
                fs.unlink(oldFilePath, (err) => {
                    if (err) {
                        console.error("Error deleting file:", err);
                        if (response)
                            sendResponse(response, 500, {error: "Error deleting file"});
                    } else {
                        console.log(`Deleted profile picture: ${userFile}`);
                        if (response)
                            sendResponse(response, 200, {message: "Profile picture deleted successfully"});
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });
}

/**
 * Deletes a user's profile picture from the server.
 *
 * @param {IncomingMessage} request - The HTTP request object.
 * @param {ServerResponse} response - The HTTP response object.
 * @returns {void}
 */
exports.profilePictureDelete = (request, response) => {
    const userId = request.headers['x-user-id'];
    if (!userId) {
        console.error("Missing x-user-id header");
        return sendResponse(response, 400, {error: 'Missing x-user-id header'});
    }

    deleteUserProfilePicture(userId, response)
        .then(() => {
            sendResponse(response, 204, {message: "Profile picture deleted successfully"});
        })
        .catch(_ => {
            sendResponse(response, 500, {error: "Error deleting profile picture"});
        });
};

/**
 * Uploads a new profile picture for a user, replacing any existing one.
 * Ensures that the file is an image and handles multipart form data.
 *
 * @param {IncomingMessage} request - The HTTP request object containing the file to upload.
 * @param {ServerResponse} response - The HTTP response object.
 * @returns {void}
 */
exports.profilePictureUpload = async (request, response) => {
    const userId = request.headers['x-user-id'];
    if (!userId) {
        console.error("Missing x-user-id header");
        return sendResponse(response, 400, {error: 'Missing x-user-id header'});
    }

    const uploadDir = join(STORAGE_DIR, PROFILE_PICTURE_DIR);

    // Create the profile picture folder if it does not exist
    createDir(uploadDir);

    // Delete the previous profile picture if it exists
    await deleteUserProfilePicture(userId);

    const contentType = request.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data'))
        return sendResponse(response, 400, {error: 'Invalid Content-Type'});

    const boundary = Buffer.from(`--${contentType.split('boundary=')[1]}`);
    let data = Buffer.alloc(0);

    request.on('data', chunk => {
        data = Buffer.concat([data, chunk]); // Accumulate binary data
    });

    request.on('end', () => {
        const boundaryIndex = data.indexOf(boundary);
        if (boundaryIndex === -1)
            return sendResponse(response, 400, {error: 'Boundary not found'});

        // Find the header section (contains filename & Content-Type)
        const headerStartIndex = boundaryIndex + boundary.length + 2;
        const headerEndIndex = data.indexOf(Buffer.from("\r\n\r\n"), headerStartIndex);
        if (headerEndIndex === -1)
            return sendResponse(response, 400, {error: 'Invalid file headers'});

        // Extract headers as a string
        const headerBuffer = data.subarray(headerStartIndex, headerEndIndex);
        const headerText = headerBuffer.toString('utf-8');

        // Extract Content-Type (MIME type) and original filename
        const contentTypeMatch = headerText.match(/Content-Type: (.+)/);
        const filenameMatch = headerText.match(/filename="(.+?)"/);

        if (!contentTypeMatch || !filenameMatch)
            return sendResponse(response, 400, {error: 'Could not extract file metadata'});

        const mimeType = contentTypeMatch[1];

        // Validate that it's an image
        if (!mimeType.startsWith("image/"))
            return sendResponse(response, 400, {error: 'Invalid file type. Only images are allowed.'});

        // Determine file extension based on MIME type
        const extension = mimeType.split('/')[1];
        const fileName = `${userId}.${extension}`;
        const filePath = join(uploadDir, fileName);

        // Extract the actual image content (without headers)
        const fileBuffer = data.subarray(headerEndIndex + 4, data.lastIndexOf(boundary) - 2);

        // Save the file
        fs.writeFile(filePath, fileBuffer, err => {
            if (err) {
                console.error("Error saving file:", err);
                return sendResponse(response, 500, {error: 'Error saving file'});
            }

            console.log(`Upload complete for ${userId}: ${filePath}`);
            sendResponse(response, 201, {message: 'File uploaded successfully', fileName: fileName});
        });
    });

    request.on('error', err => {
        console.error("Error receiving data:", err);
        sendResponse(response, 500, {error: 'Internal Server Error'});
    });
};

/**
 * Uploads a JSON file to update the JSON API data on the server.
 * Accepts the incoming request data, validates the JSON format, and writes it to a file.
 *
 * @param {IncomingMessage} request - The HTTP request object containing the JSON data.
 * @param {ServerResponse} response - The HTTP response object.
 * @returns {void}
 */
exports.jsonApiUpload = (request, response) => {
    let data = '';

    request.on('data', chunk => {
        data += chunk.toString();
    });

    request.on('end', () => {
        try {
            JSON.parse(data);

            fs.writeFile(JSON_API_PATH, data, (error) => {
                if (error) {
                    console.error('Error saving JSON:', error);
                    sendResponse(response, 400, {error: "Error saving JSON file"});
                } else {
                    console.log("JSON API updated successfully");
                    sendResponse(response, 201, {message: "JSON API updated"});
                }
            });
        } catch (e) {
            sendResponse(response, 400, {error: "Invalid JSON format"});
        }
    });
};