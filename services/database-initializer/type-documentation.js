/* TYPE DEFINITION */
const Conversation = {
    participants: {
        bsonType: "array",
        items: {
            bsonType: "string"
        },
        minItems: 2,
        uniqueItems: true
    },
    createdAt: {
        bsonType: "date"
    }
};

const Message = {
    conversationId: {
        bsonType: "objectId"
    },
    senderId: {
        bsonType: "objectId"
    },
    content: {
        bsonType: "string"
    },
    timestamp: {
        bsonType: "date"
    },
    isRead: {
        bsonType: "bool"
    }
};

const Parameters = {
    bsonType: "object",
    properties: {
        keysPlayers: {
            bsonType: "array",
            items: {
                bsonType: "array",
                items: {
                    bsonType: "string"
                }
            }
        },
        playersColors: {
            bsonType: "array",
            items: {
                bsonType: "string"
            }
        }
    },
    additionalProperties: false
};

const User = {
    name: {
        bsonType: "string",
        minLength: 4,
        maxLength: 20,
        pattern: "^[a-zA-Z0-9_\\-]+$"
    },
    parameters: Parameters,
    password: {
        bsonType: "string",
        minLength: 8,
        maxLength: 64
    },
    answers: {
        bsonType: "array",
        minItems: 3,
        maxItems: 3,
        items: {
            bsonType: "string",
            minLength: 1,
            maxLength: 50
        }
    },
    elo: {
        bsonType: "number"
    }
};

const RefreshToken = {
    userId: {
        bsonType: "string"
    },
    refreshToken: {
        bsonType: "string"
    }
};

/* UTILS */
const bsonToJsonMap = new Map([
    ["double", "number"],
    ["string", "string"],
    ["object", "object"],
    ["array", "array"],
    ["binData", "string"],
    ["objectId", "string"],
    ["bool", "boolean"],
    ["date", "string"],
    ["null", "null"],
    ["regex", "string"],
    ["javascript", "string"],
    ["int", "number"],
    ["long", "number"],
    ["decimal128", "string"],
    ["timestamp", "string"],
    ["undefined", "null"],
    ["symbol", "string"],
    ["minKey", null],
    ["maxKey", null],
    ["number", "number"]
]);

/**
 * Function to convert MongoDB schema to JSON
 * @param {Object} schema - MongoDB schema
 * @returns {Object} - JSON schema for Swagger documentation
 */
function convertBsonToSwagger(schema) {
    let swaggerSchema = {};
    for (let key in schema) {
        if (key === "bsonType") {
            swaggerSchema["type"] = bsonToJsonMap.get(schema[key]) || "string";
        } else if (typeof schema[key] === "object") {
            swaggerSchema[key] = convertBsonToSwagger(schema[key]);
        } else {
            swaggerSchema[key] = schema[key];
        }
    }
    return swaggerSchema;
}

/* JSON */
let userJson = convertBsonToSwagger(User);
userJson["_id"] = {"type": "string"};

const refreshTokenJson = convertBsonToSwagger(RefreshToken);

/* EXPORTS */
module.exports = {User, Conversation, Message, Parameters, RefreshToken, userJson, refreshTokenJson};