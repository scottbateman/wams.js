//////////// load required libraries
var url = require('url'),
	path = require('path'),
    fs = require('fs'),
	net = require('net'),
	http = require('http'),
	socketio = require('socket.io');

//////////// web server section

// Set up required variables
var homeDir = path.resolve(process.cwd(), '.');

// HTTP-server main function (handle incoming requests and serves files)
var httpServerFunc = function (req, res) {
	var uri = url.parse(req.url).pathname;
	file = fs.readFile(path.join(homeDir, uri), function (err, data) {	
		if (err) { // If file doesn't exist, serve 404 error.
			res.writeHead(404, {'Content-Type': 'text/plain', 'Content-Length': 0});
			res.end("");
		}
		else {
			switch (/.*\.([^\?.]*).*/.exec(uri)[1]) { // extract file type
				case "htm":
				case "html":
					// handler for HTML-files
					res.writeHead(200, {'Content-Type': 'text/html', 'Content-Length': data.length}); break;
				case "png":
					// handler for PNG-files
					res.writeHead(200, {'Content-Type': 'image/png', 'Content-Length': data.length}); break;
				case "css":
					// handler for CSS-files
					res.writeHead(200, {'Content-Type': 'text/css', 'Content-Length': data.length}); break;
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

//////////// location section

// This is a mock-up version of a future location server.
// In the final version, the server will receive location-data (i.e., position and orientation) from external sensors
// (e.g., Kinect, 3D-tracker, smart phones), aggregate this data, formulate relationships (e.g., proximity, intersection),
// and forward them to the WAMS-server.
// Since we don't now about the final implementation for the location server, I assume that it will talk on a low level,
// for example, a TCP-connection. The message format is also not clear, yet; for now, I am using a JSON-object with the
// following format:
// { id: "OBJECT_UUID",
//   coords: {
//     pos: {
//       x: X-COORDINATE,
//       y: Y-COORDINATE,
//       z: Z-COORDINATE
//     },
//     ori: {
//       y: YAW-VALUE,
//       p: PITCH-VALUE,
//       r: ROLL_VALUE
//     }
//   }
// }
// This is a pretty standard set of spatial information that all tracking systems (Vicon, OptiTrack, Polhemus) can output.
// Currently, there is no exchange / synchronization of UUIDs between WAMS and the location server. The only supported
// relationship is "proximity" (or more precise: the proximity between the so-called hard-coded "active_obejct" and one of
// the two hard-coded clients.

// In this mock-up-version, the input comes from a web page, on which users can drag objects to simulate movement.

// Creates a TCP-connection to the WAMS server for pushing location information.
var wamsServer = new net.Socket();
wamsServer.connect(8081, "localhost", function() {
	console.log("Connected to WAMS: 127.0.0.1:8081");
});

// Stores the coordinates for all tracked objects.
var coords = new Object();

// Stores all proximity information between objects tracked.
var proximities = new Object();
// The threshold (in pixels) under which two objects are being in proximity to each other.
var proximityThreshold = 100;

// Creates a connection to the web page on which users can drag objects around.
io = socketio.listen(http.createServer(httpServerFunc).listen(8082));
io.sockets.on('connection', function(socket) {
	socket.on('update', function(data) {
		// Stores the newly received location information
		coords[data.id] = data.coords;
		if (data.id !== "active_object") {
			// Check if the recently moved client is close to the active object.
			var currentProximity = isInProximity(coords["active_object"], coords[data.id]);
			// Check if proximity-status has changed.
			if (currentProximity != proximities["active_object" + data.id]) {
				proximities["active_object" + data.id] = currentProximity;
				// If so, notify the WAMS-server.
				wamsServer.write(JSON.stringify( { type: "proximity", value: currentProximity, time: Date.now(), pair: ["active_object", data.id] } ));
			}
		}
	});
});

// Helper function that checks if two objects are in proximity to each other.
function isInProximity(a, b) {
	if (typeof(a) == 'undefined' || typeof(b) == 'undefined') return false;
	else return distance(a, b) < proximityThreshold;
}

// Helper function that calculates Euclidean distances.
function distance(a, b) {
	if (typeof(a) == 'undefined' || typeof(b) == 'undefined') return "NaN";
	else return Math.sqrt((a.pos.x - b.pos.x) * (a.pos.x - b.pos.x) + (a.pos.y - b.pos.y) * (a.pos.y - b.pos.y) + (a.pos.z - b.pos.z) * (b.pos.z - b.pos.z));
}