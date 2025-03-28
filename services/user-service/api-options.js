const {userJson} = require("../database-initializer/type-documentation");

userJson["league"] = {league: "string"};

const userExample = {
    _id: "151vqdv445v1v21d",
    name: "Champion39",
    parameters: "parameters",
    password: "password1234",
    answers: ["Lacroix", "Rennes", "Mars attack"],
    elo: 1000,
    league: "Iron"
};

const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2N2FhNDc4M2MwZGMwYTM3YTUxM2MwYjciLCJpYXQiOjE3MzkyMTMzMzYsImV4cCI6MTczOTIxNDIzNn0.2iIKH4d9dSnS7p9-8148MEHIBvgxTdTpl8JhJGHZYm0";
const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiI2N2FhNDc4M2MwZGMwYTM3YTUxM2MwYjciLCJpYXQiOjE3MzkyMTI2NzUsImV4cCI6MTczOTIxMzU3NX0.5ZPptwWS6TZ8CGqSpKB0pZ4vzMXYCPKrTWzKq-hJfP8";

/**
 * Extracts specific properties from an object.
 *
 * This function takes an object and a list of property names, and returns a new
 * object containing only the properties specified in the list. If a property
 * does not exist in the object, it will be ignored.
 *
 * @param {Object} obj - The object to extract properties from.
 * @param {Array<string>} properties - An array of property names to extract from the object.
 * @returns {Object} A new object containing only the extracted properties.
 */
const extractProperties = (obj, properties) => {
    return properties.reduce((res, prop) => {
        if (obj.hasOwnProperty(prop)) {
            res[prop] = obj[prop];
        }
        return res;
    }, {});
};

const league = ["Wood", "Stone", "Iron", "Silver", "Gold", "Platinum", "Diamond"];

const leaderBoardSchema = Object.fromEntries(league.map(rank => [rank, {
    type: "array",
    items: {
        type: "object",
        properties: extractProperties(userJson, ["_id", "elo", "league"])
    }
}]));
leaderBoardSchema["Global"] = {
    type: "array",
    items: {
        type: "object",
        properties: extractProperties(userJson, ["_id", "elo", "league"])
    }
};

/**
 * Generates a schema for friend-related responses in the API documentation.
 *
 * This function generates a schema to describe the response when adding or accepting a friend.
 * It includes details about the message, friends' status, and their associated IDs.
 *
 * @param {string} message - The message describing the result (e.g., success message).
 * @param {string} statusOne - The status of the first user (e.g., "pending", "accepted").
 * @param {string} statusTwo - The status of the second user (e.g., "pending", "accepted").
 * @returns {Object} The Swagger schema for the response body, describing the structure of the response.
 */
const generateFriendDoc = (message, statusOne, statusTwo) => {
    return {
        type: "object",
        properties: {
            message: {
                type: "string",
                example: message
            },
            friends: {
                type: "object",
                properties: {
                    id: {
                        type: "string",
                        example: "456"
                    },
                    status: {
                        type: "string",
                        example: statusOne
                    }
                }
            },
            friendData: {
                type: "object",
                properties: {
                    friendId: {
                        type: "string",
                        example: "123"
                    },
                    status: {
                        type: "string",
                        example: statusTwo
                    }
                }
            }
        }
    };
};

/**
 * Creates an example response object to be used in API documentation.
 *
 * This function constructs a response object with the given message, user data, and tokens,
 * and returns it in the format expected by the Swagger documentation.
 * You can customize which fields are included in the response and whether the response should
 * be wrapped inside a `value` property.
 *
 * @param {string} message - The message to be included in the response.
 * @param {Array<string>} [fields=["message", "user", "accessToken", "refreshToken"]] -
 *   The list of fields to be included in the response. If omitted, the default fields are used.
 * @param {boolean} [isValue=true] - Whether to wrap the response in a `value` property.
 * @param {Array<string>} [userFields=["_id", "name", "parameters", "elo", "league"]] -
 *   The fields to be included for the `user` data. If omitted, the default user fields are used.
 * @returns {Object} The response example object that can be used in API documentation.
 */
function createResponseExample(message, fields = ["message", "user", "accessToken", "refreshToken"], isValue = true, userFields = ["_id", "name", "parameters", "elo", "league"]) {
    let value = extractProperties({
        message: message,
        user: extractProperties(userExample, userFields),
        accessToken: accessToken,
        refreshToken: refreshToken
    }, fields);
    if (isValue) {
        return {value: value};
    }
    return value;
}

exports.options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Documentation",
            version: "1.0.0"
        },
        basePath: "/api/user",
        tags: [{
            name: "User service",
            description: "Api of the user-service"
        }],
        components: {
            parameters: {
                AuthorizationHeader: {
                    in: "header",
                    name: "Authorization",
                    required: true,
                    description: "Bearer token for authentication",
                    schema: {
                        type: "string",
                        example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    }
                }
            },
            schemas: {
                user: {
                    type: "object",
                    properties: userJson,
                    example: extractProperties(userExample, ["_id", "name", "parameters", "password", "answers", "elo", "league"])
                },
                returned_user: {
                    type: "object",
                    properties: extractProperties(userJson, ["name", "parameters"]),
                    examples: {
                        nameOnly: {
                            value: extractProperties(userExample, ["name"])
                        },
                        parametersOnly: {
                            value: extractProperties(userExample, ["parameters"])
                        },
                        default: {
                            value: extractProperties(userExample, ["name", "parameters"])
                        }
                    }
                },
                connection_user: {
                    type: "object",
                    properties: extractProperties(userJson, ["name", "password"]),
                    example: extractProperties(userExample, ["name", "password"])
                },
                login_register_answer: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string"
                        },
                        user: {
                            type: "object",
                            properties: extractProperties(userJson, ["_id", "name", "parameters", "elo", "league"])
                        },
                        accessToken: {
                            type: "string"
                        },
                        refreshToken: {
                            type: "string"
                        }
                    },
                    examples: {
                        creationExample: createResponseExample("User successfully registered."),
                        loginExample: createResponseExample("User successfully logged in.")
                    }
                },
                update_answer: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string"
                        },
                        user: {
                            type: "object",
                            properties: extractProperties(userJson, ["name", "parameters"])
                        }
                    },
                    example: createResponseExample("User successfully updated.", ["message", "user"], false)
                },
                refreshToken: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string"
                        },
                        accessToken: {
                            type: "string"
                        }
                    },
                    example: createResponseExample("New access token generated successfully.", ["message", "accessToken"], false)
                },
                resetPassword: {
                    type: "object",
                    properties: extractProperties(userJson, ["name", "answers", "password"]),
                    example: extractProperties(userExample, ["name", "answers", "password"])
                },
                newPassword: {
                    type: "object",
                    properties: {
                        oldPassword: userJson.password,
                        newPassword: userJson.password
                    },
                    example: {
                        oldPassword: userExample.password,
                        newPassword: "1234password"
                    }
                },
                getELO: {
                    type: "array",
                    items: {
                        type: "string",
                        example: userExample._id
                    }
                },
                resultELO: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string"
                        },
                        playersELO: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: extractProperties(userJson, ["_id", "elo", "league"])
                            }
                        }
                    },
                    example: {
                        message: "Successfully recover ELO of each player",
                        playersELO: [extractProperties(userExample, ["_id", "elo", "league"])]
                    }
                },
                leaderboardResult: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string"
                        },
                        playersELO: {
                            type: "object",
                            properties: leaderBoardSchema
                        },
                        rank: {
                            type: "object",
                            properties: {
                                "leagueName": {
                                    type: "number"
                                },
                                "Global": {
                                    type: "number"
                                }
                            },
                            description: "Not present in the response if the user is not connected when he requests the leaderboard"

                        }
                    }
                },
                addFriendAnswer: generateFriendDoc("New friend successfully added", "requested", "pending"),
                acceptFriendAnswer: generateFriendDoc("New friend successfully accepted", "friends", "friends")
            }
        }
    },
    apis: ["./route.js"]
};