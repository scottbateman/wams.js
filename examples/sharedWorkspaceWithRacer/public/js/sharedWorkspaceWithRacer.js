var racer = require('racer');
var $ = require('jquery');
var wams = require('wams');

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
   if (null == obj || "object" != typeof obj) return obj;

   // Handle Array
   if (obj instanceof Array) {
      var copy = [];
      for (var i = 0, len = obj.length; i < len; i++) {
         copy[i] = clone(obj[i]);
      }
      return copy;
   }

   // Handle Object
   if (obj instanceof Object) {
      var copy = {};
      for (var attr in obj) {
         if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
      }
      return copy;
   }

   throw new Error("Unable to copy obj! Its type isn't supported.");
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
      elem.style.borderRadius = (element.w / 2) + 'px';

      var body = document.getElementsByTagName('body')[0];
      body.appendChild(elem);
   });
}

function moveElements(newEls, oldEls) {
   if (oldEls) {
      oldEls.forEach(function(el) {
         var elem = $('#' + el.attributes.id);
         elem.remove();
      });
      if (newEls) {
         showElements(newEls);
      }
   }
}

var MAX_CANVAS_HEIGHT = 450,
   MAX_CANVAS_WIDTH = 250,
   MIN_SCALE = 25,
   MAX_SCALE = 500,
   SCALE_DELTA = 5,
   canvas = document.getElementById('minimap'),
   ctx = canvas.getContext('2d'),
   minimapScale;

racer.ready(function(model) {
   var room = 'sharedWorkspace';
   model.subscribe(room, function() {
      window.model = model;
      // model = model.at('sharedWorkspace');

      var id = model.id();
      model.add(room + '.users', {
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
      });
      model.ref(room + '.screens.' + id, room + '.users.' + id + '.screen');
      model.ref('_page.me', room + '.users.' + id);
      model.ref('_page.users', room + '.users');
      model.ref('_page.settings', room + '.settings');
      model.ref('_page.workspace', room + '.workspace');

      model.fn('convertElements', function (els) {//{{{
         if (!els) { return []; }

         var s = model.get('_page.me.screen'),
            r = [];

         els.forEach(function(el) {
            el = clone(el);
            el.x = (el.x - s.x) / (s.s / 100);
            el.y = (el.y - s.y) / (s.s / 100);
            el.w = el.w / (s.s / 100);
            el.h = el.h / (s.s / 100);

            if (el.x + el.w > 0 &&
                el.y + el.h > 0 &&
                el.x < s.w &&
                el.y < s.h) {
               r.push(el);
            }
         });

         return r;
      });//}}}

      function updateElements() {
         var convertedEls = model.evaluate('convertElements', room + '.elements');
         model.set('_page.elements', convertedEls);
      }

      model.on('change', '_page.me.screen**', function() {
         displayScreenMode( model.get('_page.me.screen') );
         updateElements();
      });

      model.on('change', room + '.elements**', function() {
         updateElements()
         drawMinimap();
      });

      model.on('change', '_page.elements**', function(path, value, previous, passed) {
         moveElements( value, previous );
      });

      model.on('change', room + '.workspace', function(value, previous, passed) {
         if (!value.w || !value.h) { return; }

         var w, h;

         if (MAX_CANVAS_HEIGHT / MAX_CANVAS_WIDTH < value.h / value.w) {
            minimapScale = MAX_CANVAS_HEIGHT / value.h;
            h = MAX_CANVAS_HEIGHT;
            w = value.w * minimapScale;
         } else {
            minimapScale = MAX_CANVAS_WIDTH / value.w;
            h = value.h * minimapScale;
            w = MAX_CANVAS_WIDTH;
         }

         canvas.width = w;
         canvas.height = h;

         drawMinimap();
      });

      // model.on('change', room + '.minimap**', function() {
      //    drawMinimap();
      // });

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
      });

      $(window).resize(function() {
         model.set('_page.me.screen.w', window.innerWidth);
         model.set('_page.me.screen.h', window.innerHeight);
      });

      function onMouseWheel(ev) {
         var screen = model.get('_page.me.screen');
         if ((screen.s === MIN_SCALE && ev.wheelDeltaY > 0) ||
            (screen.s > MIN_SCALE && screen.s < MAX_SCALE && ev.whellDeltaY !== 0) ||
            (screen.s === MAX_SCALE && ev.wheelDeltaY < 0))
         {
            var delta = Math.floor(ev.wheelDeltaY / 120);
            model.increment('_page.me.screen.s', SCALE_DELTA * delta);
         }
      }
      var html = document.getElementsByTagName('html')[0];
      html.addEventListener('mousewheel', onMouseWheel, false);

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
      function drawBalls() {
         var color, x, y, r,
            w = model.get('_page.workspace'),
            dx = -w.x, dy = -w.y,
            elements = model.get(room + '.elements');

         elements.forEach(function(element) {
            color = extractColor(element);

            ctx.beginPath();
               ctx.fillStyle = color;
               x = dx + element.x + element.w / 2;
               y = dy + element.y + element.h / 2;
               r = element.w / 2;
               ctx.arc(x * minimapScale, y * minimapScale, r * minimapScale, 0, 360);
            ctx.fill();
         });
      }
      function drawMinimap() {
         canvas.width = canvas.width;
         canvas.height = canvas.height;
         ctx.translate(0.5, 0.5);
         drawClients(ctx);
         if (model.get('_page.settings.minimap.showElements')) {
            drawBalls(ctx);
         }
      }



   });
});

$('#rst_wrkspc_btn').click(function() {
   model.set('_page.me.screen.x', 0);
   model.set('_page.me.screen.y', 0);
   model.set('_page.me.screen.w', window.innerWidth);
   model.set('_page.me.screen.h', window.innerHeight);
   model.set('_page.me.screen.s', 100);
})

