// url will be used to parse the url (captain obvious at your service).
const url = require('url');
// fs stands for FileSystem, it's the module to use to manipulate files on the disk.
const fs = require('fs');
// path is used only for its parse method, which creates an object containing useful information about the path.
const path = require('path');
const swaggerUiPath = require("swagger-ui-dist").absolutePath();

// We will limit the search of files in the front folder (../../front from here).
// Note that fs methods consider the current folder to be the one where the app is run, that's why we don't need the "../.." before front.
const baseFrontPath = '/front';
// If the user requests a directory, a file can be returned by default.
const defaultFileIfFolder = "index.html";

/* Dict associating files' extension to a MIME type browsers understand. The reason why this is needed is that only
** the file's content is sent to the browser, so it cannot know for sure what kind of file it was to begin with,
** and so how to interpret it. To help, we will send the type of file in addition to its content.
** Note that the list is not exhaustive, you may need it to add some other MIME types (google is your friend). */
const mimeTypes = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.md': 'text/plain',
    'default': 'application/octet-stream'
};

/**
 * List of routes that should be handled as Single Page Applications
 *
 * @type {string[]}
 */
const SPA_ROUTES = ["/local", "/ai", "/ranked", "/friendly"];

/**
 * Base path for all storage-related file requests
 *
 * @type {string}
 */
const STORAGE_PATH = "/storage";

/**
 * Path to the default profile picture to use when requested image is not found
 *
 * @type {string}
 */
const DEFAULT_PROFILE_PICTURE = `./${baseFrontPath}/assets/profile.svg`;

/**
 * Enum of storage types supported by the application
 *
 * @type {Object.<string, string>}
 */
const STORAGE_TYPES = Object.freeze({
    PROFILE_PICTURE: "/profile-pictures"
});


/**
 * Map of storage type handlers that associate storage types with their respective handler functions
 *
 * @type {Object.<string, Function>}
 */
const storageHandlers = {
    [STORAGE_TYPES.PROFILE_PICTURE]: handleProfilePictureRequest
};

/**
 * Handles incoming HTTP requests and serves appropriate files
 *
 * @param {Object} request - The HTTP request object
 * @param {Object} response - The HTTP response object
 */
function manageRequest(request, response) {
    let pathName, extension;

    const parsedUrl = url.parse(request.url, true);
    const query = parsedUrl.query;
    const requestPath = parsedUrl.pathname;

    if (request.url.startsWith("/doc")) {
        pathName = path.join(swaggerUiPath, request.url.replace("/doc", ""));
        pathName = pathName.replace(/^\/app\//, "./");
        extension = path.parse(pathName).ext;
        serveFile(pathName, response, extension);
        return;
    }

    if (SPA_ROUTES.includes(request.url)) {
            pathName = `./front/${defaultFileIfFolder}`;
            extension = path.extname(pathName);
        serveFile(pathName, response, extension);
        return;
    }

    if (requestPath.startsWith(STORAGE_PATH)) {
        handleStorageRequest(requestPath, query, response);
        return;
    }

    pathName = `.${baseFrontPath}${requestPath}`;
    extension = path.extname(pathName);

    // Uncomment the line below if you want to check in the console what url.parse() and path.parse() create.
    //console.log(parsedUrl, pathName, path.parse(pathName));

    // Let's check if the file exists.
    fs.exists(pathName, async function (exist) {
        if (!exist) {
            send404(pathName, response);
            return;
        }

        // If it is a directory, we will return the default file.
        if (fs.statSync(pathName).isDirectory()) {
            pathName += `/${defaultFileIfFolder}`;
            extension = `.${defaultFileIfFolder.split(".")[1]}`;
        }

        // Let's read the file from the file system and send it to the user.
        serveFile(pathName, response, extension);
    });
}

/**
 * Determines the storage type from the request path
 *
 * @param {string} requestPath - The request path
 * @returns {string} The storage type or undefined if not found
 */
function getStorageTypeFromPath(requestPath) {
    for (const type of Object.values(STORAGE_TYPES)) {
        if (requestPath.startsWith(STORAGE_PATH + type))
            return type;
    }
}

/**
 * Handles requests for files in the storage directory
 *
 * @param {string} requestPath - The full request path
 * @param {Object} query - The query parameters
 * @param {Object} response - The HTTP response object
 */
function handleStorageRequest(requestPath, query, response) {
    const storageType = getStorageTypeFromPath(requestPath);
    const relativePath = requestPath.replace(STORAGE_PATH + storageType, '');
    const extension = path.extname(relativePath);

    if (storageHandlers[storageType]) {
        storageHandlers[storageType](relativePath, query, extension, response);
    } else {
        const pathName = `.${requestPath}`;

        fs.exists(pathName, function (exist) {
            if (!exist) {
                send404(pathName, response);
                return;
            }
            serveFile(pathName, response, extension);
        });
    }
}

/**
 * Handles requests for profile pictures with size options
 *
 * @param {string} relativePath - The path relative to the profile pictures storage
 * @param {Object} query - The query parameters containing size information
 * @param {string} extension - The file extension
 * @param {Object} response - The HTTP response object
 */
function handleProfilePictureRequest(relativePath, query, extension, response) {
    const allowedSizes = ['small', 'medium', 'large'];
    const requestedSize = query.size || 'large';

    if (!allowedSizes.includes(requestedSize)) {
        send404(relativePath, response);
        return;
    }

    const pathWithoutExt = relativePath.slice(0, -extension.length);
    const sizedPath = `${pathWithoutExt}-${requestedSize}${extension}`;
    const fullPath = `.${STORAGE_PATH}${STORAGE_TYPES.PROFILE_PICTURE}${sizedPath}`;

    fs.exists(fullPath, (exists) => {
        if (!exists)
            serveFile(DEFAULT_PROFILE_PICTURE, response, '.svg');
        else
            serveFile(fullPath, response, extension);
    });
}

/**
 * Reads and serves a file with the appropriate MIME type
 *
 * @param {string} pathName - The full path to the file
 * @param {Object} response - The HTTP response object
 * @param {string} extension - The file extension used to determine MIME type
 */
function serveFile(pathName, response, extension) {
    // Let's read the file from the file system and send it to the user.
    fs.readFile(pathName, function (error, data) {
        if (error) {
            console.log(`Error getting the file: ${pathName}: ${error}`);
            send404(pathName, response);
        } else {
            // If the file is OK, let's set the MIME type and send it.
            response.setHeader('Content-type', mimeTypes[extension] || mimeTypes['default']);
            response.end(data);
        }
    });
}

/**
 * Sends a 404 Not Found response
 *
 * @param {string} path - The path that was not found
 * @param {Object} response - The HTTP response object
 */
function send404(path, response) {
    // Note that you can create a beautiful html page and return that page instead of the simple message below.
    response.statusCode = 404;
    response.end(`File ${path} not found!`);
}

exports.manage = manageRequest;