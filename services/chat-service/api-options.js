exports.options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API Documentation",
            version: "1.0.0"
        },
        basePath: "/api/chat",
        tags: [{
            name: "Chat service",
            description: "Api of the chat-service"
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
            schemas: {}
        }
    },
    apis: ["./route.js"]
};