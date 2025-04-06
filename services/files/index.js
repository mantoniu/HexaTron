const http = require('http');
const fileQuery = require('./logic.js');
const controller = require('./controller.js');

http.createServer(async function (request, response) {
    const urlParts = request.url.split('/')
        .filter(part => part !== '');
    if (urlParts[0] === "health") {
        response.writeHead(204);
        response.end();
    } else if (urlParts[0] === 'api' && request.method === 'POST')
        controller.jsonApiUpload(request, response);
    else if (urlParts[0] === 'profile-picture' && request.method === 'POST')
        await controller.profilePictureUpload(request, response);
    else if (urlParts[0] === 'profile-picture' && request.method === 'DELETE')
        controller.profilePictureDelete(request, response);
    else {
        console.log(`Received query: ${request.url}`);
        fileQuery.manage(request, response);
    }
// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
}).listen(8001);