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
var touchPoint = {
   x: 0,
   y: 0
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
   data = decodeScreen(data.screen);
   displayScreenMode(data);
   screen = data;
});

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

   wams.on('touch', onTouch);
   wams.on('drag', onDrag);
   wams.on('release', onRelease);
}

function deleteElement(elem) {
   elem = $(elem);
   elem.remove();
}

var messageTypes = {
   new_element: appendElement
};

wams.on(WAMS.when.message_received, function(data) {
   messageTypes[data.action] && messageTypes[data.action](data.element);
});

function liftZindex(elem, num) {
   elem = $(elem);
   elem.css({ zIndex: num || 10 });
}
function lowerZindex(elem, num) {
   elem = $(elem);
   elem.css({ zIndex: num || 1 });
}
function moveElement(elem, x, y) {
   elem = $(elem);
   if (elem.hasClass('ball')) {
      elem.css({
         left: x,
         top: y
      });
   }
}
function fixTouchPoint(elem, x, y) {
   elem = $(elem);
   touchPoint.x = x - elem.offset().left;
   touchPoint.y = y - elem.offset().top;
}
function clearTouchPoint(elem) {
   touchPoint.x = 0;
   touchPoint.y = 0;
}
function lock(elem, uuid) {
   elem = $(elem);
   elem.attr('data-lock', uuid || wams.uuid);
}
function unlock(elem) {
   elem = $(elem);
   elem.attr('data-lock', "");
}
function unlocked(elem, uuid) {
   elem = $(elem);
   return (elem.attr('data-lock') === "") ||
      (elem.attr("data-lock") === uuid || wams.uuid);
}

function onTouch(ev) {
   var touches = ev.gesture.touches;
   for (var t = 0, len = touches.length; t < len; t++) {
      var target = ev.target;
      if (unlocked(target, wams.uuid)) {
         lock(target);
         liftZindex(target);
         fixTouchPoint(target, touches[t].pageX, touches[t].pageY);
      }
   }
}

function onDrag(ev) {
   var touches = ev.gesture.touches;
   for (var t = 0, len = touches.length; t < len; t++) {
      var target = ev.target;
      moveElement(target, touches[t].pageX - touchPoint.x,
         touches[t].pageY - touchPoint.y);
   }
}

function onRelease(ev) {
   var touches = ev.gesture.touches;
   for (var t = 0, len = touches.length; t < len; t++) {
      var target = ev.target;
      if (unlocked(target, wams.uuid)) {
         unlock(target);
         lowerZindex(target);
         clearTouchPoint(target);
      }
   }
}

function onRemoteTouch(data) {
   data.element.forEach(function(element) {
      var target = document.getElementById(element.attributes.id);
      if (unlocked(target, data.source)) {
         lock(target, data.source);
         liftZindex(target, 5);
      }
   });
}

function onRemoteDrag(data) {
   data.element.forEach(function(element) {
      var target = document.getElementById(element.attributes.id);
      if (unlocked(target, data.source)) {
         moveElement(target, element.x, element.y);
      }
   });
}

function onRemoteRelease(data) {
   data.element.forEach(function(element) {
      var target = document.getElementById(element.attributes.id);
      if (unlocked(target, data.source)) {
         unlock(target);
         lowerZindex(target);
      }
   });
}

wams.on('enable_remote', function(data) {
   var elements = data.data.element,
      type = data.data.type,
      i, len;
   for (i = 0, len = elements.length; i < len; i++) {
      var element = elements[i];
      if (!document.getElementById(element.attributes.id)) {
         appendElement(element);
         moveElement('#' + element.attributes.id, element.x, element.y);
      }
      if (type === 'touch') {
         data.data.source = data.source;
         onRemoteTouch(data.data);
      } else if (type === 'drag') {
         data.data.source = data.source;
         onRemoteDrag(data.data);
      } else if (type === 'release') {
         data.data.source = data.source;
         onRemoteRelease(data.data);
      }
   }
});

wams.on('disable_remote', function(data) {
   var elements = data.data.element,
      i, len;
   for (i = 0, len = elements.length; i < len; i++) {
      var element = elements[i];
      deleteElement('#' + element.attributes.id);
   }
});
