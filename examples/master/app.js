var http = require('http'),
   express = require('express'),
   path = require('path'),
   spawn = require('child_process').spawn,
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
   serverLogger = debugCreator('express'),
   exampleCreatorLogger = debugCreator('exampleCreator'),
   portList = {},
   examplesList = {};

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
      title: 'Master example',
      allExamples: examplesList
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

function getNextFreePort(port) {
   if (port && !portList[port]) { return port; }

   var beginPort = APPLICATION_SETTINGS.examplesPortRange.begin,
      endPort = APPLICATION_SETTINGS.examplesPortRange.end;

   for (port = beginPort; port <= endPort && portList[port]; port++) {}
   if (port > endPort) { port = undefined; }

   return port;
}

function prepareExampleServer(example) {
   example.state = example.state || 'run';
   example.path = path.resolve(
      example.path || path.join(__dirname, '..', example.id)
   );
   example.mainJS = example.mainJS || 'app.js';
   example.run = example.run || 'node ' + example.mainJS;
   example.port = getNextFreePort(example.port);
}

function startChildProcess(example) {
   var run = example.run.split(' '),
      prog = run[0],
      args = run.slice(1),
      settings = {
         cwd: example.path,
         env: {
            PORT: example.port
         }
      },
      proc = spawn(prog, args, settings),
      exampleLogger = debugCreator(example.id),
      exampleErrorLogger = debugCreator(example.id + ':error');

   proc.stdout.on('data', function(data) {
      exampleLogger(data.toString().trim());
   });

   proc.stderr.on('data', function(data) {
      exampleErrorLogger(data.toString().trim());
   });

   return proc;
}

function startExampleServer(id) {
   var i, example, pid;

   for (i = 0; i < EXAMPLES_LIST.length && !example; i++) {
      if (EXAMPLES_LIST[i].id === id) {
         example = EXAMPLES_LIST[i];
      }
   }

   if (example.port) {
      pid = startChildProcess(example);

      example.pid = pid;
      portList[example.port] = example.id;

      examplesList[example.id] = {
         running: true,
         pid: pid.pid,
         href: APPLICATION_SETTINGS.ip + ':' + example.port
      }
   }
}

function stopExampleServer(id) {
   var i, example;

   for (i = 0; i < EXAMPLES_LIST.length && !example; i++) {
      if (EXAMPLES_LIST[i].id === id) {
         example = EXAMPLES_LIST[i];
      }
   }

   example.pid.kill('SIGINT');
   portList[example.port] = undefined;
   example.pid = undefined;
}

function restartExampleServer(id) {
   stopExampleServer(id);
   startExampleServer(id);
}

EXAMPLES_LIST.forEach(function(example) {
   prepareExampleServer(example);
   if (example.state === 'run') {
      exampleCreatorLogger('Starting ' + example.id + ' on port ' + example.port);
      startExampleServer(example.id)
   }
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
