var racer = require('racer');
var $ = require('jquery');
var WAMS = require('wams');

var rndColor = (function() {
   var bg_colour = Math.floor(Math.random() * 16777215).toString(16);
   bg_colour = "#"+("000000" + bg_colour).slice(-6);
   return bg_colour;
}());
var rndName = (function() {
   var sampleNames = [
      'Fe', 'Thomas', 'Kirstie', 'Wynell', 'Mario', 'Aretha', 'Cherryl', 'Ta',
      'Lindy', 'Karina', 'Sacha', 'Latesha', 'Miki', 'Janel', 'Leola', 'Romeo',
      'Roderick', 'Felica', 'Ilona', 'Nila', 'Patrina', 'Wes', 'Henry', 'Elvera',
      'Karrie', 'Jacklyn', 'Alethea', 'Emogene', 'Alphonso', 'Chandra', 'Beryl',
      'Lilly', 'Georgetta', 'Darrin', 'Deane', 'Rocio', 'Charissa', 'Simona',
      'Don', 'Arianne', 'Esther', 'Leonia', 'Karma', 'Rosemarie', 'Carolyn',
      'Miriam', 'Chastity', 'Vesta', 'Christian', 'Lashaun'
   ].sort();

   return sampleNames[Math.floor(Math.random() * sampleNames.length)];
}());

function clone(obj) {
   // Handle the 2 simple types, and null or undefined
   if (null === obj || "object" !== typeof obj) { return obj; }

   var copy, i, len, attr;
   // Handle Array
   if (obj instanceof Array) {
      copy = [];
      for (i = 0, len = obj.length; i < len; i++) {
         copy[i] = clone(obj[i]);
      }
      return copy;
   }

   // Handle Object
   if (obj instanceof Object) {
      copy = {};
      for (attr in obj) {
         if (obj.hasOwnProperty(attr)) { copy[attr] = clone(obj[attr]); }
      }
      return copy;
   }

   throw new Error("Unable to copy obj! Its type isn't supported.");
}

function elInArr(element, arr) {
   if (!element) { return false; }

   var i, el;
   for ( i = 0; i < arr.length; i++ ) {
      el = arr[i];
      if (el.attributes.id === element.attributes.id) {
         return true;
      }
   }

   return false;
}

function subtrSubsetArr(arr1, arr2) {
   //arr1 is bigger than arr2
   //arr2 is subset of arr1

   var r = [];

   arr1.forEach(function(el) {
      if (!elInArr(el, arr2)) {
         r.push(el);
      }
   });

   return r;
}

function displayScreenMode(screen) {
   var screenMode = $('#mode');
   screenMode.text(screen.w + 'x' + screen.h +
      (screen.x >= 0 ? '+' + screen.x : "" + screen.x) +
      (screen.y >= 0 ? '+' + screen.y : "" + screen.y) + ':' +
      screen.s
   );
}

function extractColor(data) {
   var needToDelete = false, elem = $('#' + data.attributes.id);

   // object does not exist
   if (!elem.length) {
      needToDelete = true;

      elem = document.createElement(data.tag);
      elem.setAttribute('id', data.attributes.id);

      var body = document.getElementsByTagName('body');
      body[0].appendChild(elem);

      elem = $(elem);
   }

   var color = elem.css('background-color');
   if (needToDelete) {
      elem.remove();
   }
   return color;
}

function showElements(elements) {
   elements.forEach(function (element) {
      var elem = document.createElement(element.tag),
         attr;
      for (attr in element.attributes) {
         if (element.attributes.hasOwnProperty(attr)) {
            elem.setAttribute(attr, element.attributes[attr]);
         }
      }
      elem.innerHTML = element.innerHTML || "";

      elem.style.left = element.x + 'px';
      elem.style.top = element.y + 'px';
      elem.style.width = element.w + 'px';
      elem.style.height = element.h + 'px';

      var body = document.getElementsByTagName('body')[0];
      body.appendChild(elem);
   });
}

//this function is called when a new client connects
//it will layout update the position of all clients as they are added
//clients will try to be added if they fit within the preferred width otherwise they
//will be added below. Not exactly the jumbotron behaviour, but a simple approach
//ws is an object representing the workspace, client is an object representing the new client
var layoutFunc = function(clients, maxWS, client) {
   //track position
   var width = 0,  //width of the current row
      height = 0,  //height of the workspace
      otherClient, tempClient, minHeight;

   //figure out the display position of other screens
   for (otherClient in clients) {
      if (clients.hasOwnProperty(otherClient)) {
         if (width + clients[otherClient].w <= maxWS.w) {
            width += clients[otherClient].w;
         } else {
            //must find the min height of the current 'row'
            minHeight = Infinity;

            for (tempClient in clients) {
               //only clients on the current 'row'
               if (clients.hasOwnProperty(tempClient) &&
                   clients[tempClient].y === height &&
                   clients[tempClient].h < minHeight) {
                  minHeight = clients[tempClient].h;
               }
            }

            width = 0;
            height += minHeight;

            clients[otherClient].x = width;
            clients[otherClient].y = height;
         }
      }
   }

   client.screen.x = width;
   client.screen.y = height;
};

var MAX_CANVAS_HEIGHT = 450,
   MAX_CANVAS_WIDTH = 250,
   MIN_SCALE = 25,
   MAX_SCALE = 500,
   SCALE_DELTA = 5,
   wams = new WAMS({}),
   canvas = document.getElementById('minimap'),
   ctx = canvas.getContext('2d'),
   minimapScale;

racer.ready(function(model) {
   var room = 'jumbotron';
   model.subscribe(room, function() {
      window.model = model;
      // model = model.at('jumbotron');

      var id = model.id(),
         me = {
            id: id,
            color: rndColor,
            name: rndName,
            screen: {
               w: window.innerWidth,
               h: window.innerHeight,
               x: 0,
               y: 0,
               s: 100
            }
         };

      var maxWS = {
         w: 2000,
         h: 2000
      };
      layoutFunc(model.get(room + '.screens'), maxWS, me);

      model.add(room + '.users', me);
      model.ref(room + '.screens.' + id, room + '.users.' + id + '.screen');
      model.ref('_page.me', room + '.users.' + id);
      model.ref('_page.users', room + '.users');
      model.ref('_page.screens', room + '.screens');
      model.ref('_page.settings', room + '.settings');
      model.ref('_page.workspace', room + '.workspace');

      model.fn('convertElements', function (els) {
         if (!els) { return []; }

         var s = model.get('_page.me.screen'),
            localScale,
            r = [];

         els.forEach(function(el) {
            el = clone(el);
            el.x = (el.x - s.x) / (s.s / 100);
            el.y = (el.y - s.y) / (s.s / 100);
            localScale = el.s / s.s;
            el.w = el.w * localScale;
            el.h = el.h * localScale;

            if (el.x + el.w > 0 &&
                el.y + el.h > 0 &&
                el.x < s.w &&
                el.y < s.h) {
               r.push(el);
            }
         });

         return r;
      });

      function updateElements() {
         var convertedEls = model.evaluate('convertElements', room + '.elements');
         model.set('_page.elements', convertedEls);
      }

      model.on('change', '_page.me.screen**', function(path, value, previous, passed) {
         if (path === 's' && passed.documentRescaleCenter) {
            var rescaleP = passed.documentRescaleCenter,
               dx = Math.round(rescaleP.x * (previous - value) / 100),
               dy = Math.round(rescaleP.y * (previous - value) / 100);

            model.increment('_page.me.screen.x', dx);
            model.increment('_page.me.screen.y', dy);
         }
         displayScreenMode( model.get('_page.me.screen') );
         updateElements();
      });

      model.on('change', room + '.elements**', function() {
         updateElements();
         drawMinimap();
      });

      model.on('change', '_page.elements**', function(path, value, previous, passed) {
         moveElements( value, previous );
      });

      model.on('change', '_page.workspace**', function(path, value, previous, passed) {
         if (path !== 'w' && path !== 'h' && path !== '') { return; }

         var w, h, dimensions;

         if (path === 'w') {
            dimensions = {
               w: value,
               h: model.get('_page.workspace.h')
            };
         } else if (path === 'h') {
            dimensions = {
               w: model.get('_page.workspace.w'),
               h: value
            };
         } else if (path === '') {
            dimensions = value;
         }

         if (MAX_CANVAS_HEIGHT / MAX_CANVAS_WIDTH < dimensions.h / dimensions.w) {
            minimapScale = MAX_CANVAS_HEIGHT / dimensions.h;
            h = MAX_CANVAS_HEIGHT;
            w = dimensions.w * minimapScale;
         } else {
            minimapScale = MAX_CANVAS_WIDTH / dimensions.w;
            h = dimensions.h * minimapScale;
            w = MAX_CANVAS_WIDTH;
         }

         canvas.width = w;
         canvas.height = h;

         drawMinimap();
      });

      // model.on('change', '_page.users**', function() {
      //    drawMinimap();
      // });

      // model.on('change', room + '.minimap**', function() {
      //    drawMinimap();
      // });

      model.on('all', '**', function(path, event, args, passed) {
         // console.log(path);
         // console.log(event);
         // console.log(args);
      });

      window.onbeforeunload = function() {
         model.del(room + '.users.' + id);
         model.removeRef(room + '.screens.' + id);
      };

      $(document).ready(function() {
         var userID = $('#userID');
         userID.text( model.get('_page.me.name') );
         userID.css({ background: model.get('_page.me.color') });
         displayScreenMode( model.get('_page.me.screen') );

         updateElements();
         showElements( model.get('_page.elements') );

         restartMT();
      });

      $(window).resize(function() {
         model.set('_page.me.screen.w', window.innerWidth);
         model.set('_page.me.screen.h', window.innerHeight);
      });

      function drawClients() {
         var id, screen, color,
            users = model.get('_page.users'),
            w = model.get('_page.workspace'),
            dx = -w.x, dy = -w.y,
            drawGap = model.get('_page.settings.minimap.gapBetweenClients');

         for (id in users) {
            if (users.hasOwnProperty(id)) {
               screen = users[id].screen;
               color = users[id].color;

               ctx.beginPath();
                  ctx.strokeStyle = color;
                  ctx.setLineDash([7, 3]);
                  if (drawGap) {
                     ctx.rect((dx + screen.x) * minimapScale + 1,
                        (dy + screen.y) * minimapScale + 1,
                        screen.w * minimapScale * screen.s / 100 - 2,
                        screen.h * minimapScale * screen.s / 100 - 2);
                  } else {
                     ctx.rect((dx + screen.x) * minimapScale,
                        (dy + screen.y) * minimapScale,
                        screen.w * minimapScale * screen.s / 100,
                        screen.h * minimapScale * screen.s / 100);
                  }
               ctx.stroke();
            }
         }
      }
      function drawMinimap() {
         canvas.width = canvas.width;
         canvas.height = canvas.height;
         ctx.translate(0.5, 0.5);
         drawClients(ctx);
      }

      function moveElements(newEls, oldEls) {
         if (!newEls || !oldEls) { return; }

         var diffEls;
         if (newEls.length > oldEls.length) {
            diffEls = subtrSubsetArr(newEls, oldEls);
            showElements(diffEls);
            restartMT();
         } else if (newEls.length < oldEls.length) {
            diffEls = subtrSubsetArr(oldEls, newEls);
            diffEls.forEach(function(el) {
               $('#' + el.attributes.id).remove();
            });
         }

         newEls.forEach(function(el) {
            $('#' + el.attributes.id).css({
               left: el.x,
               top: el.y,
               width: el.w,
               height: el.h
            });
         });
      }

      function restartMT() {
         var options = {
            preventDefault: true
         };
         wams.dispose();

         var imgs = document.getElementsByClassName('drag_img');
         if (imgs.length) {
            wams.addMT(imgs);
         }

         wams.MTObjects.forEach(function(mt) {
            if (mt.element.tagName === 'IMG' &&
                       mt.element.className.indexOf('drag_img') > -1) {
               mt.on('touch', onElementTouch);
               mt.on('drag', onElementDrag);
               mt.on('release', onElementRelease);
               mt.element.addEventListener('mousewheel', onElementMouseWheel, false);
               mt.element.addEventListener('DOMMouseScroll', onElementMouseWheel, false);
               mt.on('transformstart', onElementTransformStart);
               mt.on('pinch', onElementPinch);
               mt.on('transformend', onElementTransformEnd);
            }
         });
      }

      function onElementTouch(ev) {
         var el, i,
            touch = ev.gesture.touches[0],
            target = ev.target,
            els = model.get(room + '.elements'),
            currentLockID,
            relTouchX = ev.gesture.touches[0].pageX - $(target).offset().left,
            relTouchY = ev.gesture.touches[0].pageY - $(target).offset().top;

         for ( i = 0; i < els.length; i++ ) {
            if (els[i].attributes.id === target.id) {
               break;
            }
         }

         currentLockID = els[i].attributes['data-lock'];
         if (currentLockID === '') {
            model.set(room + '.elements.' + i + '.attributes.data-lock', id);
            model.set('_page.tmp.elementRelativeTouchPoint', {x: relTouchX, y: relTouchY});
         }
      }
      function onElementDrag(ev) {
         var el, i,
            touch = ev.gesture.touches[0],
            target = ev.target,
            els = model.get(room + '.elements'),
            currentLockID,
            x = ev.gesture.touches[0].pageX,
            y = ev.gesture.touches[0].pageY,
            touchP = model.get('_page.tmp.elementRelativeTouchPoint'),
            scr = model.get('_page.me.screen'),
            relativeElementXY = {};

         for ( i = 0; i < els.length; i++ ) {
            if (els[i].attributes.id === target.id) {
               break;
            }
         }

         currentLockID = els[i].attributes['data-lock'];
         if (currentLockID === id) {
            relativeElementXY.x = Math.round((x - touchP.x) * scr.s / 100);
            relativeElementXY.y = Math.round((y - touchP.y) * scr.s / 100);
            model.set(room + '.elements.' + i + '.x', scr.x + relativeElementXY.x);
            model.set(room + '.elements.' + i + '.y', scr.y + relativeElementXY.y);
         }
      }
      function onElementRelease(ev) {
         var el, i,
            touch = ev.gesture.touches[0],
            target = ev.target,
            els = model.get(room + '.elements'),
            currentLockID;

         for ( i = 0; i < els.length; i++ ) {
            if (els[i].attributes.id === target.id) {
               break;
            }
         }

         currentLockID = els[i].attributes['data-lock'];
         if (currentLockID === id) {
            model.set(room + '.elements.' + i + '.attributes.data-lock', "");
            model.del('_page.tmp.elementRelativeTouchPoint');
         }
      }
      function onElementMouseWheel(ev) {
         var i, el, newElementScale,
            target = ev.target,
            els = model.get(room + '.elements'),
            delta = ev.wheelDelta / 120 || -ev.detail;

         for ( i = 0; i < els.length; i++ ) {
            if (els[i].attributes.id === target.id) {
               break;
            }
         }

         el = model.get(room + '.elements.' + i);
         newElementScale = Math.round(el.s + SCALE_DELTA * delta);

         if (MIN_SCALE <= newElementScale && newElementScale <= MAX_SCALE) {
            model.setDiff(room +'.elements.' + i + '.s', newElementScale);
         } else if ( newElementScale < MIN_SCALE ) {
            model.setDiff(room +'.elements.' + i + '.s', MIN_SCALE);
         } else if ( newElementScale > MAX_SCALE ) {
            model.setDiff(room +'.elements.' + i + '.s', MAX_SCALE);
         }
      }
      function onElementTransformStart(ev) {
         var i, el,
            target = ev.target,
            els = model.get(room + '.elements');

         for ( i = 0; i < els.length; i++ ) {
            if (els[i].attributes.id === target.id) {
               break;
            }
         }

         el = model.get(room + '.elements.' + i);
         model.set('_page.tmp.elScaleBeforePinch', el.s);

         wams.MTObjects.forEach(function(mt) {
            if (mt.element.tagName === 'IMG' &&
                       mt.element.className.indexOf('drag_img') > -1) {
               mt.off('drag', onElementDrag);
            }
         });
      }
      function onElementPinch(ev) {
         var i,
            pinchScale = ev.gesture.scale,
            target = ev.target,
            els = model.get(room + '.elements'),
            elScaleBeforePinch = model.get('_page.tmp.elScaleBeforePinch'),
            newElementScale = Math.round(elScaleBeforePinch * pinchScale);

         for ( i = 0; i < els.length; i++ ) {
            if (els[i].attributes.id === target.id) {
               break;
            }
         }

         if ( MIN_SCALE <= newElementScale && newElementScale <= MAX_SCALE ) {
            model.setDiff(room + '.elements.' + i + '.s', newElementScale);
         } else if ( newElementScale < MIN_SCALE ) {
            model.setDiff(room + '.elements.' + i + '.s', MIN_SCALE);
         } else if ( MAX_SCALE < newElementScale ) {
            model.setDiff(room + '.elements.' + i + '.s', MAX_SCALE);
         }
      }
      function onElementTransformEnd(ev) {
         model.del('_page.tmp.elScaleBeforePinch');

         setTimeout(function() {
            wams.MTObjects.forEach(function(mt) {
               if (mt.element.tagName === 'IMG' &&
                          mt.element.className.indexOf('drag_img') > -1) {
                  mt.on('drag', onElementDrag);
               }
            });
         }, 50);
      }
   });
});

