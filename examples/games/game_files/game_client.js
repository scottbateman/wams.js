function game(){

	// Generate a random name to assign to this user
	var sampleNames = [
		'Fe', 'Thomas', 'Kirstie', 'Wynell', 'Mario', 'Aretha', 'Cherryl', 'Ta',
		'Lindy', 'Karina', 'Sacha', 'Latesha', 'Miki', 'Janel', 'Leola', 'Romeo',
		'Roderick', 'Felica', 'Ilona', 'Nila', 'Patrina', 'Wes', 'Henry', 'Elvera',
		'Karrie', 'Jacklyn', 'Alethea', 'Emogene', 'Alphonso', 'Chandra', 'Beryl',
		'Lilly', 'Georgetta', 'Darrin', 'Deane', 'Rocio', 'Charissa', 'Simona',
		'Don', 'Arianne', 'Esther', 'Leonia', 'Karma', 'Rosemarie', 'Carolyn',
		'Miriam', 'Chastity', 'Vesta', 'Christian', 'Lashaun'
	].sort();
	var rndName = sampleNames[Math.floor(Math.random() * sampleNames.length)];

	// Card class
	// This will be the items in our simple array model
	function Card(x, y, w, h, color, id) {
		// Just a rectangle
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.color = color;
		this.id = id;
	}

	var img=document.getElementById("coin");
	// It can draw itself for now
	Card.prototype.draw = function(){
		/*ctx.fillStyle = this.color;
		ctx.globalAlpha = 0.9;
		ctx.fillRect(this.x, this.y, this.w, this.h);*/

		ctx.drawImage(img,this.x,this.y);
	}

	// Map Class
	// The map of the workspace. A rectangle with a model.
	function Map(w, h, model) {
		this.w = w;
		this.h = h;
		this.model = model;
	}

	function View(map) {
		// The default view starts at the top left and fills the screen
		this.x = 0;
		this.y = 0;
		this.w = window.innerWidth;
		this.h = window.innerHeight;
		this.ew = window.innerWidth;
		this.eh = window.innerHeight;
		this.position = -1;
		this.scale = 1;
		this.color = myCardColor;
		this.name = rndName;
		this.map = map;
	}

	View.prototype.move = function(dx, dy) {
		// wams.emit("consoleLog", "Start of View.move");
		
		// Filter out meaningless moves
		if (dx == 0 && dy == 0 ) {
			return;
		}
		
		// Moves the View about the Map
		// If the view will stay in bounds, then make the change
		var newx = this.x + dx;
		var newy = this.y + dy;
		var newr = newx + this.w;
		var newb = newy + this.h;
		if ( ( newx >= 0 ) && ( newr <= this.map.w ) &&
		   ( newy >= 0 ) && ( newb <= this.map.h ) ) {
			this.x += dx;
			this.y += dy;
		} else {
			wams.emit("consoleLog", "Hit The Boundaries");
			return;
		}
		// Redraw view
		this.draw();

		// Report possible change to server
		this.reportView();
		// wams.emit("consoleLog", "End of View.move");
	}

	// Move your top Left Corner to (x,y)
	View.prototype.moveToXY = function(x,y){
		this.x = x;
		this.y = y;
	}

	// Move your View relative to your anchor point for when you resize, anchor point is center of Map
	// | 0 | 1 |	All Views should have * as an anchor point
	// ----*----	* should remain in the Bottom Right corner of 0, Bottom Left of 1, Top Right of 2, Top Left of 3
	// | 2 | 3 |
	var halfBuffer = 75;
	View.prototype.moveToAnchor = function(){
		switch(myView.position){
			case (1): myView.moveToXY(canvasWidth/2 + halfBuffer, canvasHeight/2 +halfBuffer); myView.move(-myView.ew,-myView.eh); break;
			case (2): myView.moveToXY(canvasWidth/2 - halfBuffer, canvasHeight/2 +halfBuffer); myView.move(0,-myView.eh); break;
			case (3): myView.moveToXY(canvasWidth/2 + halfBuffer, canvasHeight/2 -halfBuffer); myView.move(-myView.ew,0); break;
			case (4): myView.moveToXY(canvasWidth/2 - halfBuffer, canvasHeight/2 -halfBuffer); this.reportView(); break;
			default: this.reportView();
		}
	}

	var setInitialPostion = false,
	 	numOtherClients = 0,
		numOtherClientsOld = 0,
		drawMode = false;
	View.prototype.draw = function() {
		// wams.emit("consoleLog", "Start of View.draw");

		if(typeof wams.uuid == "string" && !setInitialPostion){	// Only set the initial position once/after the wams client server is running
			setInitialPostion = true;
			this.position = wams.otherClients.length + 1;
			if(this.position != 0){	// If you are not the overview, get the current information from the overview user
				wams.emit("newPlayer", this);
			}
			switch(this.position){
				case 1: 
					this.color = "red";
					break;
				case 2: 
					this.color = "green";
					break;
				case 3: 
					this.color = "yellow";
					break;
				case 4: 
					this.color = "cyan";
					break;
			}

			if(this.position == 0){		// First person to join will act as the overview
				drawMode = false;	// Not allowed to draw in the beginning
				MAX_SCALE = (this.w > this.h) ? this.w/canvasWidth : this.h/canvasHeight;	// The farthest out a user can scale
				this.moveToXY(0, 2000);
				this.rescale(MAX_SCALE);
			}
			else{
				drawMode = true;
				if(this.position > 1){
					setTimeout(function(){
						myView.scaleToUser();
					},300);
				}
				this.moveToAnchor();
			}

			this.resizeCanvas();
			var name = ""; //prompt("Please enter your name","Name");
			if(name != null){
				var readyInfo = {
					name : name,
					position : this.position
				}
				wams.emit("playerReady", readyInfo);
			}
			else{
				var readyInfo = {
					name : "",
					position : this.position
				}
				wams.emit("playerReady", readyInfo);
			}
		}
		
		// If there is a change in # of people, report your view
		numOtherClients = wams.otherClients.length;
		if(numOtherClientsOld != numOtherClients){
			this.reportView();
			numOtherClientsOld = numOtherClients;
		}
		
		// Grab the model
		var model = this.map.model;
		// Clear the canvas
		ctx.clearRect(0, 0, this.w, this.h);
		// Draw the model
		ctx.save();
		// Scale since we're drawing content
		ctx.scale(this.scale, this.scale);
		// Translate the view to the model coordinates
		ctx.translate(-this.x, -this.y);
		// Draw all the cards in the model
		for (var i = 0; i < model.length; i++) {
			model[i].draw();
		}
		ctx.restore();
		ctx.save();
		// Don't scale since we're drawing UI noq
		ctx.translate(-this.x*this.scale, -this.y*this.scale);
		// And draw the other user's viewport boundaries
		for (var i = 0, len = wams.otherClients.length; i < len; i++) {
			var otherView = wams.otherClients[i].view;
			if (typeof otherView !== "undefined" && otherView.position != 0) {
				// Draw User Effective View and Real View
				// Using their color
				ctx.strokeStyle = otherView.color;

				ctx.lineWidth = "5";

				// Draw all the users Views
				ctx.beginPath();
				ctx.setLineDash([5]);
				ctx.rect(otherView.x*this.scale, otherView.y*this.scale, otherView.ew*this.scale, otherView.eh*this.scale);
				ctx.stroke();
			}
		}

		if(drawMode && setInitialPostion){
			// Draw their score
			ctx.fillStyle = 'yellow';
			ctx.font = "48px Georgia";
			ctx.fillText(score, this.x*this.scale +(this.ew*this.scale)/2 , this.y*this.scale + (this.eh*this.scale)/2);
			
			ctx.setLineDash([0]);
			ctx.strokeStyle = this.color;
			ctx.lineWidth = .01*this.w;
			ctx.beginPath();
			ctx.rect(this.x*this.scale, this.y*this.scale, this.ew*this.scale, this.eh*this.scale);
			ctx.stroke();
		}
		ctx.restore();
		// wams.emit("consoleLog", "End of View.draw");
	}

	View.prototype.reportView = function() {
		// Tell the server about my view
		var newView = {
			x : this.x,
			y : this.y,
			w : this.w,
			h : this.h,
			ew : this.ew,
			eh : this.eh,
			scale : this.scale,
			color : this.color,
			name : this.name,
			position : this.position
		}; // TODO: Strip extra information from object more elegantly
		wams.emit("updateUserView", newView);
	}

	View.prototype.resize = function(nw, nh) {
		// Filter out meaningless resizes
		if ( this.w == nw && this.h == nh ) {
			return;
		}
		// Set the new dimensions
		this.w = nw;
		this.h = nh;
		// Then set the effective view dimensions
		this.ew = Math.floor(nw/this.scale);
		this.eh = Math.floor(nh/this.scale);
		// Redraw view
		this.draw();
		// Report possible change to server
		this.reportView();
	}

	var MAX_SCALE = 0,
		MIN_SCALE = 10;
	View.prototype.rescale = function(nscale) {
		getAnchor();
		if(MIN_SCALE >= nscale && nscale >= MAX_SCALE){
			this.scale = nscale;
		}
		else{
			wams.emit("consoleLog", "Scale Out of Range");
		}
		// Then set the effective view dimensions
		this.ew = Math.floor(this.w/this.scale);
		this.eh = Math.floor(this.h/this.scale);
		
		this.moveToScaleOrigin();

		// Resize the Canvas
		this.resizeCanvas();
	}

	var scaleRatio = 0;
	View.prototype.scaleToUser = function(){
		switch (this.position){
			case 2:
				for (var i = 0; i < wams.otherClients.length; i++) {
					if(wams.otherClients[i].view.position == 1){
						scaleRatio = myView.h/wams.otherClients[i].view.eh;
						myView.rescale(scaleRatio);
						myView.moveToAnchor();
					}
				}
				break;
			case 3:
				for (var i = 0; i < wams.otherClients.length; i++) {
					if(wams.otherClients[i].view.position == 1){
						scaleRatio = myView.w/wams.otherClients[i].view.ew;
						myView.rescale(scaleRatio);
						myView.moveToAnchor();
					}
				}
				break;
			case 4:
				for (var i = 0; i < wams.otherClients.length; i++) {
					if(wams.otherClients[i].view.position == 3){
						scaleRatio = myView.h/wams.otherClients[i].view.eh;
						myView.rescale(scaleRatio);
						myView.moveToAnchor();
					}
				}
				break;
		}
	}

	View.prototype.moveToScaleOrigin = function(){
		var oldX = anchorX;
		var oldY = anchorY;
		getAnchor();
		this.move(oldX - anchorX, oldY - anchorY);
	}

	var anchorX = -1, anchorY = -1;
	function getAnchor(){
		anchorX = (myView.x + myView.ew)/2;
		anchorY = (myView.y + myView.eh)/2;
	}

	// Fired event when window is resized
	function onResized() {
		// Resize the Canvas
		myView.resizeCanvas();
		// Update the view
		myView.resize(canvas.width, canvas.height);

		myView.rescale(myView.scale);
	}

	View.prototype.resizeCanvas = function() {
		// wams.emit("consoleLog", "Start of resizeCanvas");

		// Resize the view and canvas to the window
		// Dont set the view larger than there is map to show
		myView.w = Math.min(window.innerWidth, myView.map.w - myView.x);
		myView.h = Math.min(window.innerHeight, myView.map.h - myView.y);

		canvas.width = myView.w;
		canvas.height = myView.h;

		if(typeof wams.uuid == "string"){	// If wams is initialized
			myView.moveToAnchor();
		}
		else{
			// Redraw view
			myView.draw();
			// Report possible change to server
			myView.reportView();
			// wams.emit("consoleLog", "End of resizeCanvas");
		}
	}

	var canvasWidth = 7000, 
		canvasHeight = 7000;
	function onWindowLoad() {
		// wams.emit("consoleLog", "Start of onWindowLoad");

		// Set up the Map
		myMap = new Map(canvasWidth,canvasHeight, cards);

		// Set up the View on the Map
		myView = new View(myMap);

		// Set up the canvas
		ctx = canvas.getContext('2d');

		// Set up listener for window resize
		window.addEventListener('resize', onResized, false);
		// Resize it to start
		myView.resizeCanvas();
		
		// Redraw the view
		myView.draw();

		// wams.emit("consoleLog", "End of onWindowLoad");
	}

	window.addEventListener('load', onWindowLoad, false);
	window.addEventListener("mousewheel", onMouseScroll, false);
	window.addEventListener("DOMMouseScroll", onMouseScroll, false);

	function onMouseScroll(ev) {
		if(myView.position == 0){
			var delta = Math.max(-1, Math.min(1, (ev.wheelDelta || -ev.detail)));
			var newScale = myView.scale + delta*0.09;
			myView.rescale(newScale);
		}
	}

	var cardIndex = -1;		// Index of the card to be dragged, -1 indicates no card should be dragging

	// Find if a click was in bounds of one of the cards
	function clickOnCard(x,y){
		for (var i = 0; i < cards.length; i++) {
			if( (x > cards[i].x) && (x < (cards[i].x + cards[i].w)) && (y > cards[i].y) && (y < (cards[i].y + cards[i].h))){	// Boundary checking
				return i;	// index on the card you clicked on
			}
		}
		return -1;	// Didn't click on a card
	}

	var cardWidth = .1, 	// 10% of the View Width
		cardHeight = .1; 	// 10% of the View Height
	function createNewCard(x,y){
		var newCard = new Card(x - cardWidth*myView.ew/2, y - cardHeight*myView.ew/2, cardWidth*myView.ew, cardHeight*myView.ew, myCardColor, -1);
		wams.emit("newCard", newCard);	// Tell everyone you created a new card
	}

	// Given a cardIndex, move card to (x,y)
	function moveCardToXY(cardIndex, x, y){
		cards[cardIndex].x = x - cards[cardIndex].w/2;	// Centering the Card
		cards[cardIndex].y = y - cards[cardIndex].h/2;
		myView.draw();
	}

	// Generate a random color to assign to this user
	var rndColor = function() {
    	var bg_colour = '#'+ Math.floor(Math.random()*16777215).toString(16);
      	return bg_colour;
   	}
   	
   	// Create new WAMS object
	var wams = new WAMS({
		name: name, 
		path: window.location.pathname
	});

   	var cards = new Array();
   	var myCardColor = rndColor();
   	var score = 0;
	
	// Array Remove - By John Resig (MIT Licensed)
	Array.prototype.remove = function(from, to) {
	  	var rest = this.slice((to || from) + 1 || this.length);
	 	this.length = from < 0 ? this.length + from : from;
	  	return this.push.apply(this, rest);
	}


	var canvas = document.getElementById('main');
	wams.addMT(canvas);

	// Setup multitouch events
	wams.on('tap dragstart drag dragend transformstart transform transformend', handleMT);

	var transforming = false,
		lastDeltaX = null,
		lastDeltaY = null,
		startScale = null,
		firstTap = false,
		doubleTap = false,
		cardIndex = -1,				// Index of the card to be dragged, -1 indicates no card should be dragging
		doubleTapThreshold = 300; 	// 300 milliseconds
	function handleMT(ev) {
		ev.preventDefault();
		ev.gesture.preventDefault();
		switch (ev.type) {
			case 'tap':
				var x = ev.gesture.center.pageX/myView.scale + myView.x;
				var y = ev.gesture.center.pageY/myView.scale + myView.y;
				cardIndex = clickOnCard(x,y);				// Index of the tapped card
				if(cardIndex == -1){						// If no Card was tapped
					if(firstTap){
						doubleTap = true;
						// Do action of DoubleTap not on a Card
					}
					else{									// Single tap in a viewspace
						firstTap = true;
						doubleTap = false;
						setTimeout(function(){				// Wait for a doubleTap
							if(!doubleTap && drawMode){ 	// If they didn't doubleTap and are in drawMode
								// Do action of single tap not on a card
							}
							firstTap = false;				// Complete the tap action, too late to doubletap
						}, doubleTapThreshold);
					}
					// Redraw view
					myView.draw();
				}
				else{ 	// Clicked on a Card
					if(firstTap && drawMode){						// Doubletap a Card in drawMode to delete it
						doubleTap = true;
						wams.emit("removeCard", cards[cardIndex]);	// Tell everyone about the Card to delete
						score += 5;
						wams.emit("scoreChange", myView.position);
						// Redraw view
						myView.draw();
					}
					else{											// Single tap on a Card
						firstTap = true;
						doubleTap = false;
						setTimeout(function(){						// Wait for a doubletap
							firstTap = false;						// Complete the tap action, too late to doubletap
						}, doubleTapThreshold);
					}
				}
				break;
			case 'dragstart':
				var x = ev.gesture.center.pageX/myView.scale + myView.x;
				var y = ev.gesture.center.pageY/myView.scale + myView.y;
				cardIndex = clickOnCard(x,y);
				lastDeltaX = 0;
				lastDeltaY = 0;
				break;
			case 'drag':
				var x = ev.gesture.center.pageX/myView.scale + myView.x;
				var y = ev.gesture.center.pageY/myView.scale + myView.y;
				// If we're transforming, don't drag
				if (transforming){
					return;
				}
				var dx = (lastDeltaX - ev.gesture.deltaX)/myView.scale;
				var dy = (lastDeltaY - ev.gesture.deltaY)/myView.scale;
				lastDeltaX = ev.gesture.deltaX
				lastDeltaY = ev.gesture.deltaY
				if(myView.position == 0){ 		// If the drag didn't start on a Card or you are not in drawMode, move the View
					myView.move(dx, dy); 	
				}
				else{	// If the drag started on a Card, move the Card
		   			moveCardToXY(cardIndex, x, y);
		   			wams.emit("updateCard", cards[cardIndex]);	// Tell everyone the card's new position
				}
				break;
			case 'dragend':
				cardIndex = -1;
				lastDeltaX = null;
				lastDeltaY = null;
				break;
			case 'transformstart':
				transforming = true;
				startScale = myView.scale;
				break;
			case 'transform':
				var scale = ev.gesture.scale;
				var newScale = scale * startScale;
				// myView.rescale(newScale);
				break;
			case 'transformend':
				startScale = null;
				// Stop detecting the gesture to avoid extra drags (Doesnt seem to work)
				ev.gesture.stopDetect();
				// Avoid extra drags manually
				setTimeout(function () {       
					transforming = false;
				}, 100);
				break;
		}
	}

	wams.on("newCard", onNewCard);
	wams.on("updateUserView", onUpdateUserView);
	wams.on("updateCard", onUpdateCard);
	wams.on("removeCard", onRemoveCard);
	wams.on("endGame", onGameEnd);
	wams.on("serverReady", onServerReady);

	// Recieve the newly created card to be added
	function onNewCard(data) {
		var newCard = new Card(data.x - 20, data.y - 20, data.w, data.h, data.color, data.id);
		cards.push(newCard);
		// Redraw view
		myView.draw();
	}

	function onUpdateUserView(data) {
		// Look through the list of other clients until we find the one who sent the message
		for (var i = 0, len = wams.otherClients.length; i < len; i++) {
			if (wams.otherClients[i].uuid == data.source) {
				// Then update their view object
				wams.otherClients[i].view = data.data;
				break;
			}
		}
		// Redraw view
		myView.draw();
	}

	// Recieve which card needs to be updated
	function onUpdateCard(updatedCard){
		for (var i = 0; i < cards.length; i++) {
			if(cards[i].id == updatedCard.data.id){
				cards[i].x = updatedCard.data.x;
				cards[i].y = updatedCard.data.y;
				myView.draw();
			}
		}
	}

	// Recieve which Card needs to be deleted
	function onRemoveCard(cardToRemove){
		for (var i = 0; i < cards.length; i++) {
			if(cards[i].id == cardToRemove.data.id){
				cards.remove(i);
			}
		}
		myView.draw();
	}

	function onServerReady(message){
		if(myView.position == 1){
			var startGame = setInterval(function(){
				var choice = confirm(message);
				if(choice){
					clearInterval(startGame);
					wams.emit("allPlayers", "\nPreparing to play.");
				}
			}, 2000);
		}
	}

	function onGameEnd(message){
		if(myView.position == 1){
			for (var i = cards.length - 1; i >= 0; i--) {
			 	wams.emit("removeCard", cards[i]);	// Tell everyone about the Card to delete
			}
		}
		if(myView.position != 0){
			alert(message);
		}
		score = 0;
		if(myView.position == 1){
			var playAgain = setInterval(function(){
				var choice = confirm("Play Again?");
				if(choice){
					clearInterval(playAgain);
					wams.emit("allPlayers", "\nPreparing to play again.");
				}
			}, 2000);
		}
	}
}