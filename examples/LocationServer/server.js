//////////// load required libraries
var url = require('url'),
	http = require('http'),
	path = require('path'),
    fs = require('fs'),
	WAMS = require(path.resolve('../../wams.js-server/src/wams.js')); // When using this example as base, make sure that this points to the correct WAMS server library path.

///////////////////////////////
//////////// web server section

// Set up required variables
var homeDir = path.resolve(process.cwd(), '.');
var stat404 = fs.readFileSync(path.join(homeDir, '/status_404.html'));

// HTTP-server main function (handle incoming requests and serves files)
var serverFunc = function (req, res) {

	var uri = url.parse(req.url).pathname;
	if (uri == "/") uri = "/index.html";
	file = fs.readFile(path.join(homeDir, uri), function (err, data) {	
		if (err) { // If file doesn't exist, serve 404 error.
			res.writeHead(404, {'Content-Type': 'text/html', 'Content-Length': stat404.length});
			res.end(stat404);
		}
		else {
			switch (/.*\.([^\?.]*).*/.exec(uri)[1]) { // extract file type
				case "htm":
				case "html":
					// handler for HTML-files
					res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length}); break;
				case "js":
					// handler for JavsScript-files
					res.writeHead(200, {'Content-Type': 'application/javascript', 'Content-Length': data.length}); break;
				default:
					// handler for all other file types
					res.writeHead(200, {'Content-Type': 'text/plain', 'Content-Length': data.length}); break;
			}
			res.end(data);
		}
	});
};

/////////////////////////
//////////// WAMS section

// Set up HTTP-server: listen on port 8080 and use serverFunc (see above) to serve files to clients.
var httpServer = http.createServer(serverFunc).listen(8080);

// Start WAMS using the HTTP-server
WAMS.listen(httpServer);

// Disable log-output
WAMS.set('log level', 1);

// Register callback onGreeting when WAMP receives "greeting"-message
WAMS.on("greeting", onGreeting);

function onGreeting(data) {
	// Upon receiving a "greeting"-message, send out a "response"-message to all clients
	WAMS.emit("response", "Welcome, " + data.data.from + "!");
}

// Register callback when WAMS receives a new locator-event.
WAMS.Locator.on(WAMS.Locator.when.artifact_event, function(data) {
	console.log(data);
});