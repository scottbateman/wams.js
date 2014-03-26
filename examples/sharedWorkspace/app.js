
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var os = require('os');
var wams = require('wams.js-server');
var WorkspaceManager = require('./workspaceManager');
var Workspace = require('./workspace');

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
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
  app.use(express.errorHandler());
}

function renderRoot(req, res) {
   res.render('sharedWorkspace', { title: 'Shared space between clients' });
}

app.get('/', renderRoot);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on ' + app.get('ip') + ':' + app.get('port'));
});

function drop4balls(uuid) {
   for (var i = 1; i <= 4; i++) {
      wams.emit('RECV_MSG', uuid, {
         source: '',
         data: {
            action: 'new_element',
            element: {
               tag: 'div',
               attributes: {
                  id: 'ball' + i,
                  class: 'ball'
               }
            }
         }
      });
   }
}

wams.listen(server);
var workspaceManager = new WorkspaceManager(wams);
wams.on(wams.when.new_connection, function(data) {
   var screen = Workspace.decode(data.description.screen);
   var users = wams.getSnapshot();
   var uuid = users[users.length - 1].uuid;
   var adjustedScreen = workspaceManager.addScreen(uuid, screen);

   if (adjustedScreen.x === 0 && adjustedScreen.y === 0) {
      drop4balls(uuid);
   }

   wams.emit('adjust_workspace', uuid, {
      screen: Workspace.encode(adjustedScreen)
   });

   wams.on('resize_screen', uuid, function(data) {
      var screen = Workspace.decode(data.data.screen);
      workspaceManager.resize(uuid, screen.width, screen.height);
   });

   wams.on('disconnect', uuid, function() {
      workspaceManager.deleteScreen(uuid);
   });
});

