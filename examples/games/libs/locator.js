// Connector for location server.
// This is an initial quick 'n' dirty implementation. We still have to determine how to propagate
// location events between WAMS, server, and clients.

// socket of the location-server
var locationSocket;
// list of all registered callbacks
var callbacks = new Object();

require('net').createServer(function(socket) {

	// Stores socket of the location-server for future use (e.g., exports.artifact_conneced and exports.artifact_disconneced).
	locationSocket = socket;
	console.log("Connected to location-server at " + socket.remoteAddress + ":" + socket.remotePort);

	socket.on('data', function(data) {
		var locationChanges = JSON.parse(data.toString());
		for(var i in locationChanges) {
			// Invokes the callback to the server if data from the location-server is received.
			callbacks[location_events.artifact_event](locationChanges[i]);
		}
	});

	socket.on('close', function(data) {
		console.log("Disconnected from location-server.");
	});

	socket.on('error', function(data) {
		console.log("Error on TCP connection to location-server.");
	});
}).listen(8081);

// The server can register callbacks here.
exports.on = function(type, callback) {
	callbacks[type] = callback;
}

// WAMS has detected a new artifact.
exports.artifact_conneced = function(user) {
	if (typeof locationSocket !== 'undefined') {
		locationSocket.write(JSON.stringify( { event: location_events.artifact_conneced, uuid: user.uuid } ));
	}
}

// WAMS has detected that an existing artifact was removed.
exports.user_disconneced = function(user) {
	if (typeof locationSocket !== 'undefined') {
		locationSocket.write(JSON.stringify( { event: location_events.artifact_disconneced, uuid: user.uuid } ));
	}
}

// list of all possible location events
var location_events = exports.when = {
	artifact_conneced: "ART_CON",
	artifact_disconneced: "ART_DIS",
	artifact_event: "ART_EVT"
};
