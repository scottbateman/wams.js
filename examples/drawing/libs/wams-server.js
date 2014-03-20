var socket_io = require('socket.io')
  , Vault = require('./vault')
  , User = require('./user')
  ;

//All events that sent to server
/**
 *
 * @type {{new_connection: string, subscribe_mt_event: string, send_message: string, broadcast_message: string}}
 */
var server_io_recv_calls = {
   new_connection:       "CONN"
   , subscribe_mt_event: "MT_EVENT_SUBSCRIBE"
   , send_message:       "SEND_MSG"
   , broadcast_message:  "SEND_BROADCAST"
};
//All events that received from server
/**
 *
 * @type {{connection_ok: string, user_connected: string, user_disconnected: string, receive_message: string, receive_broadcast: string}}
 */
var server_io_send_calls = {
   connection_ok:        "CONN_OK"
   , user_connected:     "CONN_USER"
   , user_disconnected:  "DEL_USER"
   , receive_message:    "RECV_MSG"
   , receive_broadcast:  "RECV_BROADCAST"
};

var MTEvents = [
   "hold", "tap", "doubletap", "drag", "dragstart", "dragend", "dragup",
   "dragdown", "dragleft", "dragright", "swipe", "swipeup", "swipedown",
   "swipeleft", "swiperight", "transform", "transformstart", "transformend",
   "rotate", "pinch", "pinchin", "pinchout", "touch", "release"
];

/**
 * User vault
 * @type {Vault}
 */
var users = new Vault();
var io;

/**
 * Start server (method follows Socket.io.listen(..) convention)
 */
exports.listen = function(server, options, callback) {
   io = socket_io.listen(server, options, callback);

   io.sockets.on('connection', function(socket) {
      socket.on(server_io_recv_calls.new_connection, function(data) {
         var newUser = new User(socket, "", data.description);
         users.push(newUser);

         socket.emit(server_io_send_calls.connection_ok, {
            data: {
               uuid: newUser.uuid,
               otherClients: users.networkExportExcept(newUser)
            }
         });

         socket.on(server_io_recv_calls.subscribe_mt_event, function(data) {
            data.data.eventType.split(" ").forEach(function(type) {
               newUser.subscribe(type);
            });
         });

         socket.broadcast.emit(server_io_send_calls.user_connected, {
            data: {
               client: newUser.copyForNetwork()
            }
         });

         MTEvents.forEach(function(type) {
            socket.on(type, function(data) {
               socket.broadcast.to(type).emit(type, {
                  source: data.source,
                  data: data.data
               });
            });
         });

         socket.on(server_io_recv_calls.send_message, function(data) {
            var source = data.source;
            var targets = data.data.targets;
            var msg = data.data.msg;

            targets.forEach(function(target) {
               var user = users.get(target);
               user.socket.emit(server_io_send_calls.receive_message, {
                  source: source,
                  data: msg
               });
            });
         });

         socket.on(server_io_recv_calls.broadcast_message, function(data) {
            var source = data.source;
            var msg = data.data.msg;

            socket.broadcast.emit(server_io_send_calls.receive_broadcast, {
               source: source,
               data: msg
            });
         });

         socket.once('disconnect', function() {
            socket.broadcast.emit(server_io_send_calls.user_disconnected, {
               data: {
                  client: newUser.uuid
               }
            });
            users.pop(newUser);
         });
      });
   });
};

/**
 * Receive event from client
 * @param {string} type Type of event
 * @param {string|User} [source] From where should we expect event.
 *    If not specified, expects from all clients.
 * @param {function} callback Execute when event received
 */
exports.on = function(type, source, callback) {
   if (typeof io === "undefined") {
      throw new Error("WAMS has to be started first");
   }

   var socket;
   switch (arguments.length) {
      case 2:
         callback = source;
         source = undefined;
         socket = '*';
         break;
      case 3:
         console.log(typeof source);
         console.log(source);
         if (typeof source === 'string') {
            var user = users.get(source);
            if (typeof user === 'undefined') { throw new Error('Wrong uuid'); }
            socket = user.socket;
         } else if (source.socket) {
            socket = source.socket;
         } else if (source.on) {
            socket = source;
         } else {
            throw new Error('Incorrect source');
         }
         break;
      default:
         throw new Error("Incorrect amount of arguments");
         break;
   }

   if (socket === '*') {
      io.sockets.on('connection', function(socket) {
         socket.on(type, function(data) {
            callback(data);
         });
      });
   } else {
      socket.on(type, function(data) {
         callback(data);
      });
   }
};

/**
 * Send event to client
 * @param {string} type Type of event
 * @param {string|User} [destination] Where should event happen. If not specified
 *    this event is emitted to all clients
 * @param {string|object} data Data sent alongside with event
 */
exports.emit = function(type, destination, data) {
   var socket;
   switch (arguments.length) {
      case 2:
         data = destination;
         destination = undefined;
         socket = '*';
         break;
      case 3:
         if (typeof destination === 'string') {
            var user = users.get(destination);
            if (typeof user === 'undefined') { throw new Error('Wrong uuid'); }
            socket = user.socket;
         } else if (destination.socket) {
            socket = destination.socket;
         } else if (destination.emit) {
            socket = destination;
         } else {
            throw new Error('Incorrect destination');
         }
         break;
      default:
         throw new Error("Incorrect amount of arguments");
         break;
   }

   if (socket === "*") {
      var i;
      for (i = 0; i < users.length; i++) {
         users[i].socket.emit(type, data);
      }
   } else {
      socket.emit(type, data);
   }
};

/**
 * Returns snapshot of vault. This snapshot is not updated, when vault is updated
 * @returns {Array} Copies of users
 */
exports.getSnapshot = function() {
   return users.localExport();
};
