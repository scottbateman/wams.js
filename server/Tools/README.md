wams.js-server Tools
==============

Location Server

This is a mock-up for a (future) location server. See the comments in location-server.js for details.

Starting the location server:
1) Open TWO Node.js terminals or command prompts and navigate to the LocationServer-directory.
1a) If you have not installed socket.io, do so:
npm install socket.io
2) In one Node.js window, run your WAMS-server or the minimal WAMS-server that comes with the location server:
node WAMS-server.js
3) In the other Node.js window, run the location server:
node location-server.js
4) Open a browser window and go to http://localhost:8082/index.html
5) There you can move around the beacon and the two people. Once one of the people gets close to the beacon, you should see an event in the log of your WAMS-server.
