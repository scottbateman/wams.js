// Connector for location server.
// This is an initial quick 'n' dirty implementation. We still have to determine how to propagate
// location events between WAMS, server, and clients.
require('net').createServer(function(sock) {
   console.log("Connected to location-server at " + sock.remoteAddress + ":" + sock.remotePort);
   sock.on('data', function(data) {
      console.log(JSON.parse(data));
   });
   sock.on('close', function(data) {
      console.log("Disconnected from location-server.");
   });
}).listen(8081, "localhost");