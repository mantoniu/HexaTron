const controller = require("./controller");
const {createServiceServer} = require("../utils/routing-utils");
const {options} = require("./api-options");

const routes = [
    {
        method: "GET",
        path: ["conversations"],
        handler: controller.getConversations
    },
    {
        /**
         * @swagger
         * /api/chat/health:
         *   get:
         *     summary: Health check for Docker
         *     description: Health check to determine if the service is ready to use.
         *     tags:
         *       - Chat service
         *     responses:
         *       204:
         *          description: Only the http code of the response
         */
        method: "GET",
        path: ["health"],
        handler: controller.health
    },
    {
        /**
         * @swagger
         * /api/chat/doc:
         *   get:
         *     summary: Get the API
         *     description: Return the API documentation to the sender of the request.
         *     tags:
         *       - Chat service
         *     responses:
         *       200:
         *         description: The API converted to the JSON format and stringify.
         *       500:
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         *                   example: "Failed to read API documentation"
         *                 details:
         *                   type: string
         *                   example: "Error message here"
         */
        method: "GET",
        path: ["doc"],
        handler: controller.documentation
    },
    {
        method: "DELETE",
        path: ["deleteUser"],
        handler: controller.deleteUser
    }
];

module.exports = createServiceServer(routes, options, process.env.CHAT_API);
