var rndColor = function() {
   var bg_colour = Math.floor(Math.random() * 16777215).toString(16);
   bg_colour = "#"+("000000" + bg_colour).slice(-6);
   return bg_colour;
};
var sampleNames = [
   'Fe', 'Thomas', 'Kirstie', 'Wynell', 'Mario', 'Aretha', 'Cherryl', 'Ta',
   'Lindy', 'Karina', 'Sacha', 'Latesha', 'Miki', 'Janel', 'Leola', 'Romeo',
   'Roderick', 'Felica', 'Ilona', 'Nila', 'Patrina', 'Wes', 'Henry', 'Elvera',
   'Karrie', 'Jacklyn', 'Alethea', 'Emogene', 'Alphonso', 'Chandra', 'Beryl',
   'Lilly', 'Georgetta', 'Darrin', 'Deane', 'Rocio', 'Charissa', 'Simona',
   'Don', 'Arianne', 'Esther', 'Leonia', 'Karma', 'Rosemarie', 'Carolyn',
   'Miriam', 'Chastity', 'Vesta', 'Christian', 'Lashaun'
].sort();
var name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
var color = rndColor();

function displayScreenMode(data) {
   var screenMode = $('#mode');
   screenMode.text(data.width + 'x' + data.height +
      (data.x >= 0 ? '+' + data.x : "" + data.x) +
      (data.y >= 0 ? '+' + data.y : "" + data.y) + ':' +
      data.scale
   );
}

function encodeScreen(data) {
   return data.width + ':' + data.height + ':' +
      data.x + ':' + data.y  + ':' +
      data.scale;
}

function decodeScreen(str) {
   var screenSplitted = str.split(':');

   return {
      width : +screenSplitted[0],
      height : +screenSplitted[1],
      x : +screenSplitted[2],
      y : +screenSplitted[3],
      scale : +screenSplitted[4]
   }
}

var screen = {
   width: window.innerWidth,
   height: window.innerHeight,
   x: 0,
   y: 0,
   scale: 1
};

var wams = new WAMS({screen: encodeScreen(screen), name: name, color: color});

$(document).ready(function() {
   var userID = $('#userID');
   userID.text(name);
   userID.css({ background: color });

   displayScreenMode(screen);
});

$(window).resize(function() {
   screen.width = window.innerWidth;
   screen.height = window.innerHeight;

   displayScreenMode(screen);
   wams.emit('resize_screen', {screen: encodeScreen(screen)});
});

wams.on('adjust_workspace', function(data) {
   displayScreenMode(decodeScreen(data.screen));
});

//wams.on(WAMS.when.connection_ok, function() {
//
//});

function appendElement(data) {
   var elem = document.createElement(data.tag);
   for (attr in data.attributes) {
      if (data.attributes.hasOwnProperty(attr)) {
         elem.setAttribute(attr, data.attributes[attr]);
      }
   }
   elem.innerHTML = data.innerHTML || "";

   var body = document.getElementsByTagName('body');
   body[0].appendChild(elem);

   wams.addMT(elem);
}

var messageTypes = {
   new_element: appendElement
};

wams.on(WAMS.when.message_received, function(data) {
   messageTypes[data.action] && messageTypes[data.action](data.element);
});
