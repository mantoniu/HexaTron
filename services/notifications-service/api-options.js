const {notificationJSON} = require("../database-initializer/type-documentation");

const notificationExample = {
    userId: "151vqdv445v1v21d",
    type: "friendRequest",
    friendId: "354scaf887v1v47d",
    objectId: ["789fdgd796t7a59b"]
};

exports.options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Documentation",
            version: "1.0.0"
        },
        basePath: "/api/notifications",
        tags: [{
            name: "Notifications service",
            description: "Api of the notifications-service"
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
                notification: {
                    type: "object",
                    required: ["userId", "type", "friendId"],
                    properties: notificationJSON,
                    example: notificationExample
                }
            }
        }
    },
    apis: ["./route.js"]
};