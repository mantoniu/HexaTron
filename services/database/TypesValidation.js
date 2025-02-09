const Parameters = {
    bsonType: "object",
    properties: {
        _keysPlayers: {
            bsonType: "array",
            items: {
                bsonType: "array",
                items: {
                    bsonType: "string"
                }
            }
        },
        _playersColors: {
            bsonType: "array",
            items: {
                bsonType: "string"
            }
        }
    }
};

export const User = {
    name: {
        bsonType: "string",
        minLength: 3,
        maxLength: 100
    },
    email: {
        bsonType: "string",
        pattern: "^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$"
    },
    age: {
        bsonType: "int",
        minimum: 18,
        maximum: 120
    },
    parameters: {
        bsonType: Parameters
    }
};