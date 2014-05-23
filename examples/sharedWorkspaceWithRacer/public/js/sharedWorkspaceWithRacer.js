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

function showBalls(elements) {
   elements.forEach(function (element) {
      var elem = document.createElement(element.tag),
         attr;
      for (attr in element.attributes) {
         if (element.attributes.hasOwnProperty(attr)) {
            elem.setAttribute(attr, element.attributes[attr]);
         }
      }
      elem.innerHTML = element.innerHTML || "";

      var body = document.getElementsByTagName('body')[0];
      body.appendChild(elem);
   });
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
         name: rndName
      });
      model.add(room + '.screens', {
         id: id,
         w: window.innerWidth,
         h: window.innerHeight,
         x: 0,
         y: 0,
         s: 100
      });
      model.ref('_page.me', room + '.users.' + id);
      model.ref('_page.screen', room + '.screens.' + id);
      model.ref('_page.settings', room + '.settings');

      window.onbeforeunload = function() {
         model.del(room + '.users.' + id);
         model.del(room + '.screens.' + id);
      };

      $(document).ready(function() {
         var userID = $('#userID');
         userID.text( model.get('_page.me.name') );
         userID.css({ background: model.get('_page.me.color') });
         displayScreenMode( model.get('_page.screen') );
         showBalls( model.get(room + '.elements') );
      });

      $(window).resize(function() {
         model.set('_page.screen.w', window.innerWidth);
         model.set('_page.screen.h', window.innerHeight);
      });

      function rescaleElements() {
         var scale = model.get('_page.screen.s'),
            elements = model.get(room + '.elements');
         elements.forEach(function(element) {
            var elem = document.getElementById(element.attributes.id);
            if (elem) {
               elem = $(elem);
               elem.css({
                  x: element.x * scale / 100,
                  y: element.y * scale / 100,
                  width: element.w * scale / 100,
                  height: element.h * scale / 100,
                  borderRadius: +elem.css('width') / 2
               });
            }
         });
      }
      function onMouseWheel(ev) {
         var screen = model.get('_page.screen');
         if ((screen.s === MIN_SCALE && ev.wheelDeltaY > 0) ||
            (screen.s > MIN_SCALE && screen.s < MAX_SCALE && ev.whellDeltaY !== 0) ||
            (screen.s === MAX_SCALE && ev.wheelDeltaY < 0))
         {
            var delta = Math.floor(ev.wheelDeltaY / 120);
            model.increment('_page.screen.s', SCALE_DELTA * delta);
            rescaleElements(SCALE_DELTA * delta);
         }
      }
      var html = document.getElementsByTagName('html')[0];
      html.addEventListener('mousewheel', onMouseWheel, false);

      model.on('change', '_page.screen**', function() {
         displayScreenMode( model.get('_page.screen') );
      });

      function drawClients() {
         var id, screen, color,
            screens = model.get(room + '.screens'),
            clients = model.get(room + '.users'),
            drawGap = model.get('_page.settings.minimap.gapBetweenClients');

         for (id in screens) {
            if (screens.hasOwnProperty(id)) {
               screen = screens[id];
               color = clients[id].color;

               ctx.beginPath();
                  ctx.strokeStyle = color;
                  ctx.setLineDash([7, 3]);
                  if (drawGap) {
                     ctx.rect(screen.x * minimapScale + 1,
                        screen.y * minimapScale + 1,
                        screen.w * minimapScale * screen.s / 100 - 2,
                        screen.h * minimapScale * screen.s / 100 - 2);
                  } else {
                     ctx.rect(screen.x * minimapScale,
                        screen.y * minimapScale,
                        screen.w * minimapScale * screen.s / 100,
                        screen.h * minimapScale * screen.s / 100);
                  }
               ctx.stroke();
            }
         }
      }
      function drawBalls() {
         var color, x, y, r,
            elements = model.get(room + '.elements');

         elements.forEach(function(element) {
            color = extractColor(element);

            ctx.beginPath();
               ctx.fillStyle = color;
               x = element.x + element.w / 2;
               y = element.y + element.h / 2;
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

      model.on('change', room + '.elements**', function() {
         drawMinimap();
      });
      model.on('change', room + '.minimap**', function() {
         drawMinimap();
      });
   });
});

$('#rst_wrkspc_btn').click(function() {
   model.set('_page.me.screen.x', 0);
   model.set('_page.me.screen.y', 0);
   model.set('_page.me.screen.w', window.innerWidth);
   model.set('_page.me.screen.h', window.innerHeight);
   model.set('_page.me.screen.s', 100);
})

