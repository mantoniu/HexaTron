const fs = require("fs");
const swaggerJsdoc = require("swagger-jsdoc");

/**
 * Generates API documentation and writes it to a file.
 *
 * @param {string} path - The path where the documentation will be saved.
 * @param {object} options - The options used for generating the API documentation.
 */
function generateDocumentationAPI(path, options) {
    try {
        fs.writeFileSync(path, JSON.stringify(swaggerJsdoc(options)), {flag: "wx"});
        console.log("File successfully created");
    } catch (err) {
        if (err.code === "EEXIST") {
            console.log("The file already exists");
        } else {
            throw err;
        }
    }
}

/**
 * Reads data from a file. If the file doesn't exist, generates it and then reads the content.
 *
 * @param {string} path - The path to the file.
 * @param {object} options - The options used to generate the file if it doesn't exist.
 * @returns {string} The content of the file.
 */
function readData(path, options = null) {
    try {
        return fs.readFileSync(path, "utf8");
    } catch (err) {
        if (err.code === "ENOENT") {
            console.log("File not found. Creating the file...");
            try {
                generateDocumentationAPI(path, options);
                return readData(path);
            } catch (error) {
                throw error;
            }
        } else {
            throw err;
        }
    }
}

module.exports = {generateDocumentationAPI, readData};