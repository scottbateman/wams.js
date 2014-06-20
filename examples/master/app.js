var http = require('http'),
   express = require('express'),
   path = require('path'),
   spawn = require('child_process').spawn,
   socket_io = require('socket.io'),
   readLine = require('readline'),
   debugCreator = require('debug'),
   favicon = require('static-favicon'),
   logger = require('morgan');

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

/**
 * all fields in EXAMPLE_LIST object
 * {
 *    id: String,
 *    port: Number,
 *    state: 'run|stop'
 *    path: String,
 *    mainJS: String,
 *    run: String
 * }
 *
 * id is required
 * port - on which port run example
 * state - run or do not run by default
 * path - folder with example
 * mainJS - which file is main file of app
 * run - string to run app
 */
/**
 * fields of examplesList:
 * {
 *    'id': {
 *       running: Boolean,
 *       pid: Number,
 *       port: Number
 *    },
 *    'id2': {},
 *    ...
 * }
 */

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
var io = new socket_io(server);

function getExample(id) {
   var i, example;

   for (i = 0; i < EXAMPLES_LIST.length && !example; i++) {
      if (EXAMPLES_LIST[i].id === id) {
         example = EXAMPLES_LIST[i];
      }
   }

   return example;
}

function updateExamplesList(example) {
   examplesList[example.id] = {
      running: example.pid ? true : false,
      pid: example.pid ? example.pid.pid : 0,
      port: example.port
   };
}

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

   updateExamplesList(example);
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
   var example = getExample(id), pid;

   if (example.port) {
      pid = startChildProcess(example);

      example.pid = pid;
      portList[example.port] = example.id;

      updateExamplesList(example);
   }
}

function stopExampleServer(id) {
   var example = getExample(id);

   example.pid.kill('SIGINT');
   portList[example.port] = undefined;
   example.pid = undefined;

   updateExamplesList(example);
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
   var id;

   for (id in EXAMPLES_LIST) {
      if (EXAMPLES_LIST.hasOwnProperty(id) && EXAMPLES_LIST[id].pid) {
         EXAMPLES_LIST[id].pid.kill('SIGINT');
      }
   }

   process.exit();
});

io.on('connection', function(socket) {
   function onStart(id) {
      startExampleServer(id);
      var copy = clone(examplesList[id]);
      copy.id = id;

      io.emit('started', copy);
   }
   function onStop(id) {
      stopExampleServer(id);

      io.emit('stopped', id);
   }

   socket.on('start', onStart);
   socket.on('stop', onStop);
   socket.on('restart', function(id) {
      onStop(id);
      onStart(id);
   });
});