const http = require('http');

const fileQuery = require('./logic.js');

http.createServer(function (request, response) {
  if (request.url.split("/")[1] === "health") {
    response.writeHead(204);
    response.end();
    return;
  }
  console.log(`Received query for a file: ${request.url}`);
  fileQuery.manage(request, response);
// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
}).listen(8001);