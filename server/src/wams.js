var socket_io = require('socket.io');

var MTEvents = [
   "hold", "tap", "doubletap", "drag", "dragstart", "dragend", "dragup",
   "dragdown", "dragleft", "dragright", "swipe", "swipeup", "swipedown",
   "swipeleft", "swiperight", "transform", "transformstart", "transformend",
   "rotate", "pinch", "pinchin", "pinchout", "touch", "release"
];

var client_Class = function(uuid, mode, description) {
   this.uuid = uuid;
   this.mode = mode;
   this.description = description;
   this.MTSubscription = [];

   this.equals = function(user) {
      return (this.uuid === user.uuid);
   };
   this.subscribe = function(event) {
      this.MTSubscription.push(event);
   };
};
var storage_Class = function() {
   this.length = 0;
   this.push = function(user) {
      this[this.length] = user;
      this.length++;
   };
   this.pop = function(user) {
      if (this.length === 0) {return undefined;}

      var toDelete = -1, i, deleted;
      for (i = 0; i < this.length && toDelete === -1; i++) {
         if (this[i].equals(user)) {toDelete = i;}
      }
      if (toDelete === -1) {return undefined;}

      deleted = this[toDelete];
      for (i = toDelete; i < this.length - 1; i++) {
         this[i] = this[i + 1];
      }
      delete this[this.length - 1];
      this.length--;

      return deleted;
   };
   this.except = function(user) {
      var list = [];
      for (var i = 0; i < this.length; i++) {
         if (!this[i].equals(user)) {
            list.push(this[i]);
         }
      }
      return list;
   };
   this.get = function(uuid) {
      for (var i = 0; i < this.length; i++) {
         if (this[i].uuid === uuid) {return this[i];}
      }
      return undefined;
   };
};

//user storage
var users = new storage_Class();

exports.listen = function(server, options, callback) {
   var io = socket_io(server, options, callback);

   io.sockets.on('connection', function(socket) {
      socket.on('CONN', function(data) {
         var newUser = new client_Class(getUUID(),"", data.description);
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
