
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var os = require('os');

var racerBrowserChannel = require('racer-browserchannel');
var liveDbMongo = require('livedb-mongo');
var redis = require('redis').createClient();
var racer = require('racer');

var wams = require('wams.js-server');

var store = racer.createStore({
   db: liveDbMongo('localhost:27017/wams?auto_reconnect', { safe: true }),
   redis: redis
});

var app = express();

var iface = os.networkInterfaces().wlp3s0;
var IP;
iface && iface.forEach(function(connection) {
   if (connection.family === 'IPv4') {
      IP = connection.address;
   }
});

// all environments
app.set('ip', process.argv[2] || process.env.IP || IP || '127.0.0.1');
app.set('port', process.argv[3] || process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// app.set('env', 'development');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(racerBrowserChannel(store));
app.use(store.modelMiddleware());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

store.on('bundle', function(browserify) {
   browserify.require('./public/js/lib/jquery-1.10.2.js', { expose: 'jquery' });
   browserify.require('./public/js/lib/hammer.js', { expose: 'hammerjs' });
   browserify.require('socket.io-client', { expose: 'socket.io-client' });
   browserify.require('./public/js/lib/wams.js', { expose: 'wams' });
});

var model = store.createModel();
var roomPath = 'sharedWorkspace';

var resetUsers = true;
var resetBalls = true;
var showElementsOnMinimap = true;
var gapBetweenClients = true;

model.subscribe(roomPath, function(err) {
   if (err) { throw err; }

   if (resetUsers) {
      model.set(roomPath + '.users', {});
      model.set(roomPath + '.screens', {});
      model.set(roomPath + '.workspace', {});
   }

   model.set(roomPath + '.settings.minimap.showElements', showElementsOnMinimap);
   model.set(roomPath + '.settings.minimap.gapBetweenClients', gapBetweenClients);

   if (resetBalls || model.get(roomPath + ".elements") === undefined) {
      var elements = [];
      for (var i = 1; i <= 4; i++) {
         var element = {
            tag: 'div',
            attributes: {
               id: 'ball' + i,
               class: 'ball',
               'data-lock': ''
            },
            type: 'ball',
            x: (i - 1 - 2 * Math.floor((i - 1) / 2)) * 125 + 100,
            y: Math.floor((i - 1) / 2) * 125 + 300,
            w: 100,
            h: 100,
            s: 100
         };
         elements.push(element);
      }
      model.set(roomPath + '.elements', elements);
   }

   model.fn('workspaceBorder', function(screens) {
      if (isEmpty(screens)) { return { x: 0, y: 0, w: 0, h: 0 }; }

      var id, screen, screen_x2, screen_y2, w, h,
         x = Infinity, y = Infinity, x2 = -Infinity, y2 = -Infinity;

      for (id in screens) {
         if (screens.hasOwnProperty(id)) {
            screen = screens[id];
            screen_x2 = screen.x + screen.w * screen.s / 100;
            screen_y2 = screen.y + screen.h * screen.s / 100;

            if (screen.x < x) {
               x = screen.x;
            }
            if (screen.y < y) {
               y = screen.y;
            }
            if (screen_x2 > x2) {
               x2 = screen_x2;
            }
            if (screen_y2 > y2) {
               y2 = screen_y2;
            }
         }
      }

      w = x2 - x;
      h = y2 - y;

      return {x: x, y: y, w: w, h: h};
   });
   model.on('change', roomPath + '.screens**', function() {
      var workspace = model.evaluate('workspaceBorder', roomPath + '.screens');
      model.set(roomPath + '.workspace', workspace);
   });
});

function createBundle(req, res, next) {
   store.bundle(__dirname + '/public/js/sharedWorkspaceWithRacer.js',
      function(err, js) {
         if (err) { return next(err); }
         res.type('js');
         res.send(js);
      }
   );
}

function isEmpty(map) {
   for(var key in map) {
      if (map.hasOwnProperty(key)) {
         return false;
      }
   }
   return true;
}

function renderRacer(req, res, next) {
   model.bundle(function(err, bundle) {
      if (err) { return next(err); }

      var settings = {
         title: 'Shared space between clients with racer',
         bundle: JSON.stringify(bundle)
      };
      console.log(settings.bundle);
      res.render('sharedWorkspaceWithRacer', settings);
   });
}

app.get('/js/sharedWorkspaceWithRacer.js', createBundle);
app.get('/', renderRacer);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on ' + app.get('ip') + ':' + app.get('port'));
});

wams.listen(server);
