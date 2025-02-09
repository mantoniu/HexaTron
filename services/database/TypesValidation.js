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
    parameters: {
        bsonType: Parameters
    },
    password: {
        bsonType: "string"
    }
};