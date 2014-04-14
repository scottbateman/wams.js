
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
                  class: 'ball',
                  'data-lock': ''
               }
            }
         }
      });
   }
}

function notifyResize(uuid, screen) {
   var users = wams.getSnapshot(), i, len, listUUID;
   for (i = 0, len = users.length; i < len; i++) {
      listUUID = users[i].uuid;
      if (listUUID !== uuid) {
         wams.emit('RECV_MSG', listUUID, {
            source: '',
            data: {
               action: 'adjust_other_workspace',
               metadata: {
                  uuid: uuid,
                  screen: screen
               }
            }
         });
      }
   }
}

wams.listen(server);
var workspaceManager = new WorkspaceManager(wams);
wams.on(wams.when.new_connection, function(data) {
   var screen = Workspace.decode(data.description.screen);
   var users = wams.getSnapshot();
   var uuid = users[users.length - 1].uuid;
   var adjustedScreen = workspaceManager.addScreen(uuid, screen);
   var notifiedDisableRemoteList = [];

   if (adjustedScreen.x === 0 && adjustedScreen.y === 0) {
      drop4balls(uuid);
   }

   wams.emit('adjust_workspace', uuid, {
      screen: Workspace.encode(adjustedScreen)
   });
   notifyResize(uuid, Workspace.encode(adjustedScreen));

   wams.on('resize_screen', uuid, function(data) {
      var screen = Workspace.decode(data.data.screen);
      workspaceManager.resize(uuid, screen.width, screen.height);

      notifyResize(uuid, data.data.screen);
   });

   wams.on('disconnect', uuid, function() {
      workspaceManager.deleteScreen(uuid);
   });

   var handler = function(data) {
      if (!data.data.element.length) {
         return;
      }
      var elem = data.data.element[0], corner = [{}, {}, {}, {}], i, len,
         enableRemoteList = [], disableRemoteList = [],
         screen = workspaceManager.getScreen(uuid);
      elem.x += screen.x;
      elem.y += screen.y;
      corner[0].x = elem.x;
      corner[0].y = elem.y;
      corner[1].x = corner[0].x + elem.w;
      corner[1].y = corner[0].y;
      corner[2].x = corner[0].x;
      corner[2].y = corner[0].y + elem.h;
      corner[3].x = corner[0].x + elem.w;
      corner[3].y = corner[0].y + elem.h;

      for (i = 0, len = corner.length; i < len; i++) {
         var under = workspaceManager.under(corner[i].x, corner[i].y);
         under.forEach(function(el) {
            if (enableRemoteList.indexOf(el) === -1) {
               enableRemoteList.push(el);
            }
         });
      }

      disableRemoteList = workspaceManager.allExcept(enableRemoteList);
      if (enableRemoteList) {
         enableRemoteList.forEach(function(listUUID) {
            var indexOfNDRL = notifiedDisableRemoteList.indexOf(listUUID);
            if (indexOfNDRL > -1) {
               notifiedDisableRemoteList.splice(indexOfNDRL, 1);
            }

            if (uuid !== listUUID) {
               var abs = {
                  x: elem.x,
                  y: elem.y
               };
               elem.x -= workspaceManager.getScreen(listUUID).x;
               elem.y -= workspaceManager.getScreen(listUUID).y;
               wams.emit('enable_remote', listUUID, data);
               elem.x = abs.x;
               elem.y = abs.y;
            }
         });
      }
      if (disableRemoteList) {
         disableRemoteList.forEach(function(listUUID) {
            if (notifiedDisableRemoteList.indexOf(listUUID) === -1) {
               var msg = {
                  data: {
                     element: [
                        { attributes: { id:'' } }
                     ]
                  }
               }, i, len;
               for (i = 0, len = data.data.element.length; i < len; i++) {
                  msg.data.element[i].attributes.id = data.data.element[i].attributes.id;
               }
               wams.emit('disable_remote', listUUID, msg);
               notifiedDisableRemoteList.push(listUUID);
            }
         });
      }
   };

   wams.on('touch', uuid, handler);
   wams.on('drag', uuid, handler);
   wams.on('release', uuid, handler);
});

