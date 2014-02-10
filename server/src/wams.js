var socket_io = require('socket.io')
  , Storage = require('./storage')
  , User = require('./user')
  ;

var MTEvents = [
   "hold", "tap", "doubletap", "drag", "dragstart", "dragend", "dragup",
   "dragdown", "dragleft", "dragright", "swipe", "swipeup", "swipedown",
   "swipeleft", "swiperight", "transform", "transformstart", "transformend",
   "rotate", "pinch", "pinchin", "pinchout", "touch", "release"
];

var getUUID = function() {
   return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
   });
};

//user storage
var users = new Storage();

exports.listen = function(server, options, callback) {
   var io = socket_io(server, options, callback);

   io.sockets.on('connection', function(socket) {
      socket.on('CONN', function(data) {
         var newUser = new User(getUUID(),"", data.description);
         users.push(newUser);

         socket.emit('CONN_OK', {
            uuid: newUser.uuid,
            otherClients: users.except(newUser)
         });

         socket.on('MT_EVENT_SUBSCRIBE', function(data) {
            data.eventType.split(" ").forEach(function(type) {
               newUser.subscribe(type);
               socket.join(type);
            });
         });

         socket.broadcast.emit('CONN_USER', {
            client: newUser
         });

         MTEvents.forEach(function(type) {
            socket.on(type, function(data) {
               console.log(data);
               socket.broadcast.to(type).emit(type, data);
            });
         });

         socket.once('disconnect', function() {
            socket.broadcast.emit('DEL_USER', {
               client: newUser
            });
            users.pop(newUser);
         });
      });
   });
};
