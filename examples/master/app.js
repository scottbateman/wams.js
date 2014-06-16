var http = require('http'),
   express = require('express'),
   path = require('path'),
   readLine = require('readline'),
   debugCreator = require('debug'),
   favicon = require('static-favicon'),
   logger = require('morgan');

var APPLICATION_SETTINGS = {
      ip: 'localhost',
      port: 8950,
      examplesPortRange: {
         begin: 8951,
         end: 8999
      }
   },
   EXAMPLES_LIST = [
      {
         id: 'HelloWorld',
         mainJS: 'server.js'
      },
      {
         id: 'circles'
      },
      {
         id: 'chat'
      },
      {
         id: 'locationPhotoSharing'
      },
      {
         id: 'drawing',
         mainJS: 'server.js'
      },
      {
         id: 'sharedWorkspace'
      },
      {
         id: 'sharedWorkspaceWithRacer'
      },
      {
         id: 'games',
         mainJS: 'game_server.js'
      },
      {
         id: 'LocationServer',
         mainJS: 'server.js',
         state: 'stop'
      }
   ];

var app = express(),
   serverLogger = debugCreator('express');

// express settings
app.set('ip', APPLICATION_SETTINGS.ip);
app.set('port', APPLICATION_SETTINGS.port);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// middleware setup
app.use(favicon());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', function(req, res) {
   var settings = {
      title: 'Express'
   };
   res.render('index', settings);
});

// catch 404 and redirect to index
app.use(function(req, res) {
   res.redirect('/');
});

var server = http.createServer(app);
server.listen(app.get('port'), function() {
  serverLogger('Express server listening on port ' + server.address().port);
});

// graceful shutdown on windows
if (process.platform === 'win32') {
   var rl = readLine.createInterface({
      input: process.stdin,
      output: process.stdout
   });

   rl.on('SIGINT', function() {
      process.emit('SIGINT');
   });
}

process.on('SIGINT', function() {

   process.exit();
});
