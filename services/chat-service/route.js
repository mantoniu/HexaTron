const controller = require("./controller");
const {createServiceServer} = require("../utils/routing-utils");
const {options} = require("./api-options");

const routes = [
    {
        /**
         * @swagger
         * /api/chat/conversations:
         *   get:
         *     summary: Get all conversations or a specific one
         *     description: Returns either all conversations (each with its first message) or a specific conversation, depending on the presence of an id in the url.
         *     tags:
         *       - Chat service
         *     responses:
         *       200:
         *        description: A list of conversations or a single conversation
         *        content:
         *           application/json:
         *             schema:
         *               oneOf:
         *                 - $ref: '#/components/schemas/conversation'
         *                 - $ref: '#/components/schemas/conversations'
         *       404:
         *         description: Conversation not found.
         *       500:
         *         description: Internal server error while fetching conversation
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         *                   example: Error message
         */
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
        /**
         * @swagger
         * /api/chat/delete-user:
         *   delete:
         *     summary: Delete all data related to a removed user
         *     description: Receives the ID of a deleted user and removes all related data from the conversations and messages collections. This route is used by the user service.
         *     tags:
         *       - Chat service
         *     requestBody:
         *       description: ID of the deleted user
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               userId:
         *                 type: string
         *                 example: 151vqdv445v1v21d
         *     responses:
         *       200:
         *         description: Deletion completed successfully.
         *       500:
         *         description: Internal server error while deleting elements linked to the user.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         *                   example: Error message
         */
        method: "DELETE",
        path: ["delete-user"],
        handler: controller.deleteUser
    }
];

module.exports = createServiceServer(routes, options, process.env.CHAT_API);
