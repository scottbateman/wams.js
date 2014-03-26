//////////// load required libraries
var url = require('url'),
	path = require('path'),
    fs = require('fs'),
	net = require('net'),
	http = require('http'),
	socketio = require('socket.io');

///////////////////////////////
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
/////////////////////////////
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

// list of all possible location events
var location_events = {
	artifact_conneced: "ART_CON",
	artifact_disconneced: "ART_DIS",
	artifact_event: "ART_EVT"
};

var wamsServerSocket, websiteSocket;

/////////////////////////////////////////
////// communication with the WAMS-server

// Creates a TCP-connection to the WAMS server for pushing location information.
wamsServerSocket = net.createConnection(8081, function() {

	console.log("Connected to WAMS at 127.0.0.1:8081");
	
	wamsServerSocket.on('data', function(data) {
		data = JSON.parse(data.toString()); // reconstructs JSON-object

		if (data.event == location_events.artifact_conneced) {
		}
		else if (data.event == location_events.artifact_disconneced) {
			delete coords[data.uuid]; // cleans up storage
		}

		if (websiteSocket != 'undefined') websiteSocket.emit(data.event, data); // forwards JSON-object to web page
	});
});

//////////////////////////////////////
////// communication with the web page

// Creates a connection to the web page on which users can drag objects around.
io = socketio.listen(http.createServer(httpServerFunc).listen(8082));
io.set('log level', 1);

io.sockets.on('connection', function(socket) {
	websiteSocket = socket; // stores socket from web site for future use (see above)
	
	socket.on(location_events.artifact_event, function(data) {
		coords[data.id] = data.coords; // stores the newly received location information

		for (var id in coords) { // checks if in proximity to other artifacts ...
			if (data.id != id) { // ... except yourself
				var ids = [id, data.id].sort(); // sort ids to avoid duplicates
				var currentProximity = isInProximity(coords[ids[0]], coords[ids[1]]); // determine proximity between artifacts
				if (currentProximity != proximities[ids[0] + ids[1]]) { // if proximity-status changed ...
					proximities[ids[0] + ids[1]] = currentProximity; // ... store new status ... 
					wamsServerSocket.write(JSON.stringify( { type: "proximity", value: currentProximity, time: Date.now(), pair: [ids[0], ids[1]] } )); // ... and notify WAMS.
				}
			}
		}

	});
});

////// internal location-server stuff

// Stores the coordinates for all tracked objects.
var coords = new Object();

//////////////
//// proximity

// Stores all proximity information between objects tracked.
var proximities = new Object();
// The threshold (in pixels) under which two objects are being in proximity to each other.
var proximityThreshold = 100;
// Helper function that checks if two objects are in proximity to each other.
function isInProximity(a, b) {
	if (typeof(a) == 'undefined' || typeof(b) == 'undefined') return false;
	else return distance(a, b) < proximityThreshold;
}

////////////////////////////
//// general helper function

// Helper function that calculates Euclidean distances.
function distance(a, b) {
	if (typeof(a) == 'undefined' || typeof(b) == 'undefined') return "NaN";
	else return Math.sqrt((a.pos.x - b.pos.x) * (a.pos.x - b.pos.x) + (a.pos.y - b.pos.y) * (a.pos.y - b.pos.y) + (a.pos.z - b.pos.z) * (b.pos.z - b.pos.z));
}