/* TYPE DEFINITION */
const Conversation = {
    bsonType: "object",
    required: ["createdAt"],
    properties: {
        _id: {
            bsonType: "objectId"
        },
        participants: {
            bsonType: "array",
            items: {
                bsonType: "objectId"
            },
            minItems: 2,
            uniqueItems: true
        },
        createdAt: {
            bsonType: "date"
        },
        isGlobal: {
            bsonType: "bool"
        }
    },
    oneOf: [
        {required: ["participants"]},
        {required: ["isGlobal"]}
    ]
};

const Message = {
    bsonType: "object",
    required: ["conversationId", "senderId", "content", "timestamp", "isRead"],
    properties: {
        _id: {
            bsonType: "objectId"
        },
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
    }
};

const Parameters = {
    bsonType: "object",
    required: ["keysPlayers", "playersColors"],
    properties: {
        _id: {
            bsonType: "objectId"
        },
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
    bsonType: "object",
    required: ["name", "parameters", "password", "answers", "elo"],
    properties: {
        _id: {
            bsonType: "objectId"
        },
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
        },
        friends: {
            bsonType: "array",
            items: {
                bsonType: "object",
                properties: {
                    friendId: {
                        bsonType: "objectId"
                    },
                    status: {
                        bsonType: "string"
                    }
                }
            }
        },
        notificationTokens: {
            bsonType: "array",
            items: {
                bsonType: "string"
            }
        }
    }
};

const RefreshToken = {
    bsonType: "object",
    required: ["userId", "refreshToken"],
    properties: {
        _id: {
            bsonType: "objectId"
        },
        userId: {
            bsonType: "string"
        },
        refreshToken: {
            bsonType: "string"
        }
    }
};

const Notifications = {
    bsonType: "object",
    required: ["userId", "type", "friendId", "isRead"],
    properties: {
        _id: {
            bsonType: "objectId"
        },
        userId: {
            bsonType: "string"
        },
        type: {
            bsonType: "string"
        },
        friendId: {
            bsonType: "objectId"
        },
        objectsId: {
            bsonType: "array",
            items: {
                bsonType: "string"
            }
        },
        isRead: {
            bsonType: "bool"
        }
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
const userJson = convertBsonToSwagger(User.properties);
const refreshTokenJson = convertBsonToSwagger(RefreshToken);
let conversationJson = convertBsonToSwagger(Conversation.properties);
const messageJson = convertBsonToSwagger(Message.properties);
messageJson["senderName"] = {type: "string"};
delete messageJson.conversationId;
conversationJson["messages"] = {
    type: "object",
    properties: {
        message_id: {
            type: "object",
            properties: messageJson
        }
    }
};
const notificationJSON = convertBsonToSwagger(Notifications.properties);
delete notificationJSON._id;
delete notificationJSON.isRead;

/* EXPORTS */
module.exports = {User, Conversation, Message, Parameters, RefreshToken, Notifications, userJson, refreshTokenJson, conversationJson, notificationJSON};