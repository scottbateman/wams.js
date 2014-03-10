
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var os = require('os');
var wams = require('wams.js-server');
var sharejs = require('share').server;

var app = express();

var iface = os.networkInterfaces()['wlp3s0'];
var IP;
iface && iface.forEach(function(connection) {
   if (connection.family === 'IPv4') {
      IP = connection.address;
   }
});

// all environments
app.set('ip', IP || process.argv[2] || '127.0.0.1');
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', renderChat);
app.get('/chat', renderChat);

function renderChat(req, res) {
   res.render('chat', { title: 'Chat on tokens using library' })
}

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on ' + app.get('ip') +  ':' + app.get('port'));
});

wams.listen(server);

var shareJS_options = {
   staticpath: '/js/lib/sharejs'
   , db: {type: 'none'}
};

sharejs.attach(app, shareJS_options);
