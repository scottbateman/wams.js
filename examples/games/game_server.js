//////////// load required libraries
var url = require('url'),
	http = require('http'),
	path = require('path'),
    fs = require('fs'),
	WAMS = require(path.resolve('libs/wams-server.js')); // When using this example as base, make sure that this points to the correct WAMS server library path.

//////////// web server section

// Set up required variables
var homeDir = path.resolve(process.cwd(), '.');
var stat404 = fs.readFileSync(path.join(homeDir, '/status_404.html'));

// HTTP-server main function (handle incoming requests and serves files)
var serverFunc = function (req, res) {

	var uri = url.parse(req.url).pathname;

	// ---------- Choose Your Game Here ----------
	if (uri == "/") uri = "/game_files/quickGrab.html";
	// --------------------------------------------------

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

//////////// WAMS section

// Set up HTTP-server: listen on port 3000 and use serverFunc (see above) to serve files to clients.
var httpServer = http.createServer(serverFunc).listen(3000);

// Start WAMS using the HTTP-server
WAMS.listen(httpServer);

// WAMS Callback functions for different signals
WAMS.on("updateUserView", onUpdateUserView);
WAMS.on("updateCard", onUpdateCard);
WAMS.on("removeCard", onRemoveCard);
WAMS.on("consoleLog", onConsoleLog);
WAMS.on("allPlayers", onAllPlayers);
WAMS.on("newPlayer", onNewPlayer);
WAMS.on("scoreChange", onScoreChange);
WAMS.on("playerReady", onPlayerReady);

var player1,
	player2,
	player3,
	player4;
function onNewPlayer(player_data){
	switch(player_data.data.position){
		case 1:
			player1 = player_data.data;
			player1.name = "Alice";
			console.log("\nPlayer " + player1.position + " has joined.");
			break;
		case 2:
			player2 = player_data.data;
			player2.name = "Brian";
			console.log("\nPlayer " + player2.position + " has joined.");
			break;
		case 3:
			player3 = player_data.data;
			player3.name = "Cathy";
			console.log("\nPlayer " + player3.position + " has joined.");
			break;
		case 4:
			player4 = player_data.data;
			player4.name = "Darren";
			console.log("\nPlayer " + player4.position + " has joined.");
			break;
	}
}

function onUpdateUserView(view_data) {
	switch (view_data.data.position){
		case 1:
			player1.x = view_data.data.x;
			player1.y = view_data.data.y;
			player1.ew = view_data.data.ew;
			player1.eh = view_data.data.eh;
			break;
		case 2:
			player2.x = view_data.data.x;
			player2.y = view_data.data.y;
			player2.ew = view_data.data.ew;
			player2.eh = view_data.data.eh;
			break;
		case 3:
			player3.x = view_data.data.x;
			player3.y = view_data.data.y;
			player3.ew = view_data.data.ew;
			player3.eh = view_data.data.eh;
			break;
		case 4:
			player4.x = view_data.data.x;
			player4.y = view_data.data.y;
			player4.ew = view_data.data.ew;
			player3.eh = view_data.data.eh;
			break;
	}
	WAMS.emit("updateUserView", view_data);
}

function onUpdateCard(data){
	WAMS.emit("updateCard", data);
}

function onRemoveCard(data){
	WAMS.emit("removeCard", data);
}

function onConsoleLog(consoleMessage){
	console.log("\n" + consoleMessage.source+ ": " + consoleMessage.data);
}

var player1Ready = false, 
	player2Ready = false,
	player3Ready = false,
	player4Ready = false;	
function onPlayerReady(ready_info){
	switch (ready_info.data.position){
		case 1:
			if(ready_info.data.name != ""){
				player1.name = ready_info.data.name;
			}
			player1Ready = true;
			break;
		case 2:
			if(ready_info.data.name != ""){
				player2.name = ready_info.data.name;
			}
			player2Ready = true;
			break;
		case 3:
			if(ready_info.data.name != ""){
				player3.name = ready_info.data.name;
			}
			player3Ready = true;
			break;
		case 4:
			if(ready_info.data.name != ""){
				player4.name = ready_info.data.name;
			}	
			player4Ready = true;
			break;
	}
	if(player1Ready && player2Ready && player3Ready && player4Ready){
		WAMS.emit("serverReady", "Everyone is ready, start game?");
	}
}

var gameStart = false;
function onAllPlayers(data){
	console.log(data.data);
	player1.score = 0; player2.score = 0; player3.score = 0; player4.score = 0;
	setTimeout(function () { 
		gameStart = true;
		console.log("\nStarting Game.");
		starInBuffer(0);starInBuffer(1);starInBuffer(1);starInBuffer(2);starInBuffer(2);starInBuffer(3);starInBuffer(3);starInBuffer(4);starInBuffer(4);
		var gameLoop = setInterval(function(){
			var oneToOneHundred = Math.floor((Math.random() * 100) + 1);
			if(oneToOneHundred < 20){
				// Spawn in buffer 1
				starInBuffer(1);
				console.log("Star Created in buffer 1");
			}
			else if (oneToOneHundred < 40){
				// Spawn in buffer 2
				starInBuffer(2);
				console.log("Star Created in buffer 2");
			}
			else if (oneToOneHundred < 60){
				// Spawn in buffer 3
				starInBuffer(3);
				console.log("Star Created in buffer 3");
			}
			else if (oneToOneHundred < 80){
				// Spawn in buffer 4
				starInBuffer(4);
				console.log("Star Created in buffer 4");
			}
			else{
				// Spawn in Common buffer
				starInBuffer(0);
				console.log("Star Created in common buffer");
			}

		},750);
		setTimeout(function(){
			gameStart = false;
			clearInterval(gameLoop);
			console.log("\nEnding Game.");
			var endMessage = "";
			endMessage += "Scores" + "\n" +
						  player1.name + ": " + player1.score + "\n" +
						  player2.name + ": " + player2.score + "\n" +
						  player3.name + ": " + player3.score + "\n" +
						  player4.name + ": " + player4.score;
			WAMS.emit("endGame", endMessage);
		}, 10000);
	}, 3000);
}

var cardID = 0;
function starInBuffer(bufferIndex){
	switch (bufferIndex){
		case 0: // Common
			var x = player2.x + (Math.random() * (player1.x + player1.ew - player2.x));
			var y = player4.y + (Math.random() * (player2.y + player2.eh - player4.y));
			break;
		case 1: // Top
			var x = player2.x + (Math.random() * (player1.x + player1.ew - player2.x));
			var y = player1.y + (Math.random() * (player3.y - player1.y));
			break;
		case 2: // Left
			var x = player3.x + (Math.random() * (player4.x - player3.x));
			var y = player3.y + (Math.random() * (player1.y + player1.eh - player3.y));
			break;
		case 3: // Right
			var x = player3.x + player3.ew + (Math.random() * (Math.min(player4.x + player4.ew, player2.x + player2.ew) - player3.x - player3.ew));
			var y = player4.y + (Math.random() * (player2.y + player2.eh - player4.y));
			break;
		case 4: // Bottom
			var x = player4.x + (Math.random() * (player3.x + player3.ew - player4.x));
			var y = player2.y + player2.eh + (Math.random() * (player4.y + player4.eh - player2.y - player2.eh));
			break;
	}

	var cardData = {
		x : x,
		y : y,
		w : 75,
		h : 75,
		color : "pink",
		id : cardID
	}
	++cardID;
	WAMS.emit("newCard", cardData);
}

function onScoreChange(position){
	if(gameStart){
		switch (position.data){
			case 1:
				player1.score += 5;
				break;
			case 2:
				player2.score += 5;
				break;
			case 3:
				player3.score += 5;
				break;
			case 4:
				player4.score += 5;
				break;	
		}
	}
}