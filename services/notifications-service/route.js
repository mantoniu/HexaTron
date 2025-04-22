const controller = require("./controller");
const {createServiceServer} = require("../utils/routing-utils");
const {options} = require("./api-options");

const routes = [
    {
        /**
         * @swagger
         * /api/notifications/health:
         *   get:
         *     summary: Health check for Docker
         *     description: Health check to determine if the service is ready to use.
         *     tags:
         *       - Notifications service
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
         * /api/notifications/doc:
         *   get:
         *     summary: Get the API
         *     description: Return the API documentation to the sender of the request.
         *     tags:
         *       - Notifications service
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
         * /api/notifications/add-notification:
         *   post:
         *     summary: Add a new notification
         *     description: Creates a new notification and stores it in the database. This route is used by the user, chat and game service.
         *     tags:
         *       - Notifications service
         *     requestBody:
         *       description: Notification data to be stored
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/notification'
         *     responses:
         *       201:
         *         description: Notification successfully created
         *       400:
         *         description: Invalid notification data format
         *       500:
         *         description: Internal server error while adding a notification.
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 error:
         *                   type: string
         *                   example: Error message
         */
        method: "POST",
        path: ["add-notification"],
        handler: controller.addNotification
    },
    {
        /**
         * @swagger
         * /api/notifications/delete-user:
         *   delete:
         *     summary: Delete all data related to a removed user
         *     description: Receives the ID of a deleted user and removes all related data from the conversations and messages collections. This route is used by the user service.
         *     tags:
         *      - Notifications service
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
    },
    {
        /**
         * @swagger
         * /api/notifications:
         *   delete:
         *     summary: Delete a notification using friendId and objectId
         *     description: Deletes a specific notification based on the provided friendId and objectId. This route is used by the game service.
         *     tags:
         *       - Notifications service
         *     parameters:
         *       - in: query
         *         name: friendId
         *         required: true
         *         schema:
         *           type: string
         *           example: 151vqdv445v1v21d
         *         description: ID of the friend related to the notification
         *       - in: query
         *         name: objectId
         *         required: true
         *         schema:
         *           type: array
         *           items:
         *              type: string
         *           example: [823afls932a5a9h5]
         *         description: ID of the objects associated with the notification
         *     responses:
         *       204:
         *         description: Deletion completed successfully.
         *       500:
         *         description: Internal server error while deleting the notification.
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
        path: [],
        handler: controller.delete
    }
];

module.exports = createServiceServer(routes, options, process.env.NOTIFICATIONS_API);
