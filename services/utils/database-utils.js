const {ObjectId} = require("mongodb");

/**
 * Converts a string ID into a MongoDB ObjectId.
 *
 * @param {string} id - The ID string to convert into an ObjectId.
 * @returns {ObjectId} - The corresponding ObjectId.
 * @throws {Error} Throws an error if the ID is not a valid ObjectId format.
 */
function convertToID(id) {
    return new ObjectId(id);
}

/**
 * Converts a MongoDB ObjectId into a string.
 *
 * @param {ObjectId} id - The ObjectId to convert into a string.
 * @returns {string} - The hexadecimal string representation of the ObjectId.
 */
function convertToString(id) {
    return id.toHexString();
}

module.exports = {convertToID, convertToString};