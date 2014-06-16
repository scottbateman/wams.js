var http = require('http'),
   express = require('express'),
   path = require('path'),
   readLine = require('readline'),
   debugCreator = require('debug'),
   favicon = require('static-favicon'),
   logger = require('morgan');

var app = express(),
   serverLogger = debugCreator('express');

// express settings
app.set('port', process.argv[2] || process.env.PORT || 8999);

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
