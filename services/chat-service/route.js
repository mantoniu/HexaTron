const controller = require("./controller");
const {createServiceServer} = require("../utils/routing-utils");

const routes = [
    {
        method: "GET",
        path: ["conversations"],
        handler: controller.getConversations
    },
    {
        method: "POST",
        path: ["conversations"],
        handler: controller.createConversation
    },
    {
        method: "GET",
        path: ["health"],
        handler: controller.health
    }
];

module.exports = createServiceServer(routes);