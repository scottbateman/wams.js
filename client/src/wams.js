all();
function all() {
   /**
    * Function is alias to {@link WAMS.init}
    * @param {object} [settings] Settings for wams library
    * @param {object} clientDescription User specified description of client
    * @returns {WAMS.init} Instance of session
    *
    * @alias WAMS
    * @constructor
    */
   var WAMS = function(settings, clientDescription) {
      var cases = {
         0: function() {
            throw new Error("Wrong amount of arguments");
         },
         1: function() {
            clientDescription = settings;
            settings = {};
            return undefined;
         },
         2: function() {
            return undefined;
         }
      };
      cases[arguments.length] && cases[arguments.length]();
      return new WAMS.init(settings, clientDescription);
   };

   /**
    * Check if uuid is valid
    * @param {string} uuid uuid to check
    * @returns {boolean}
    */
   var isUUID = function(uuid) {
      var uuidRegexp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegexp.test(uuid);
   };

//   var //Returns true if object is a DOM node
//      isNode = function(o) {
//         return (typeof Node === "object" ? o instanceof Node :
//            o && typeof o === "object" && typeof o.nodeType === "number"
//               && typeof o.nodeName === "string");
//      }
//      , //Returns true if object is a DOM element
//      isElement = function(o) {
//         return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
//            o && typeof o === "object" && o !== null && o.nodeType === 1
//               && typeof o.nodeName === "string");
//      }
//      , //Returns true if object is jQuery element
//      isJQueryElement = function(o) {
//         return (o instanceof WAMS.modules.$);
//      }
//      , //Check if object is empty
//      isEmpty = function(obj) {
//         for (var key in obj) {
//            if (obj.hasOwnProperty(key))
//               return false;
//         }
//         return true;
//      }
//      , //default drag callback
//      defaultDragCallback = function(ev) {
//         var $ = WAMS.modules.$;
//
//      };

   /**
    * Is true when {@link WAMS.init#socket socket} is connected and
    * {@link WAMS.init#MTObjects MT objects} initialized
    * @type {boolean}
    */
   WAMS.READY = false;

    //All events that sent to server
   /**
    *
    * @type {{new_connection: string, subscribe_mt_event: string, message_sent: string, broadcast_sent: string, ask_front: string, ask_back: string, ask_left: string, ask_right: string}}
    */
   var io_send_calls = {
      new_connection:       "CONN"
      , subscribe_mt_event: "MT_EVENT_SUBSCRIBE"
      , message_sent:       "SEND_MSG"
      , broadcast_sent:     "SEND_BROADCAST"
      , ask_front:          "ASK_FRONT"
      , ask_back:           "ASK_BACK"
      , ask_left:           "ASK_LEFT"
      , ask_right:          "ASK_RIGHT"
   };
   //All events that received from server
   /**
    *
    * @type {{connection_ok: string, user_connected: string, user_disconnected: string, message_received: string, broadcast_received: string, get_front: string, get_back: string, get_left: string, get_right: string}}
    */
   var io_recv_calls = WAMS.when = {
      connection_ok:        "CONN_OK"
      , user_connected:     "CONN_USER"
      , user_disconnected:  "DEL_USER"
      , message_received:   "RECV_MSG"
      , broadcast_received: "RECV_BROADCAST"
      , get_front:          "RECV_FRONT"
      , get_back:           "RECV_BACK"
      , get_left:           "RECV_LEFT"
      , get_right:          "RECV_RIGHT"
   };
   io_recv_calls.has = function(target) {
      for (var i in this) {
         if (this[i] === target) {
            return true;
         }
      }
      return false;
   };
   //   WAMS.events = new WAMS.modules.ev();

   /**
    * Function initializes new session instance
    * @param {object} [settings] Settings for wams library
    * @param {object} clientDescription User specified description of client
    * @returns {WAMS.init} Instance of session
    *
    * @constructor
    */
   WAMS.init = function(settings, clientDescription) {
      var self = this, host = settings.host;

      /**
       * Description of client for current session
       * @type {Object}
       */
      this.description = clientDescription;
      /**
       * Objects that has multi-touch properties
       * @type {Array}
       */
      this.MTObjects = [];
      this.MTSelector = "";

      /**
       * Array with all clients connected to server except this
       * @type {Array}
       */
      this.otherClients = [];

      /**
       * Socket to the host for the current session
       * @type {*|io.Socket}
       */
      this.socket = WAMS.modules.io.connect(host);


      this.socket.emit(io_send_calls.new_connection, {
         description: clientDescription
      });
      this.socket.on(io_recv_calls.connection_ok, function(data) {
         self.uuid = data.data.uuid;
         self.position = data.data.position;
         self.otherClients = data.data.otherClients;

         //TODO fire event or something similar when connection happened
      });
      this.socket.on(io_recv_calls.user_connected, function(data) {
         self.otherClients.push(data.data.client);

         //TODO fire event
      });
      this.socket.on(io_recv_calls.user_disconnected, function(data) {
         if (self.otherClients.length > 0) {
            var toDelete = -1, i;
            for (i = 0; i < self.otherClients.length && toDelete === -1; i++) {
               if (self.otherClients[i].uuid === data.data.client) {toDelete = i;}
            }
            if (toDelete != -1) {
               self.otherClients.splice(toDelete, 1);
            }

            //TODO fire event
         }
      });
      this.socket.on(io_recv_calls.message_received, function(data) {
//         console.log(data);
         //TODO fire event
      });
      this.socket.on(io_recv_calls.broadcast_received, function(data) {
//         console.log(data);
         //TODO fire event
      });

      WAMS.READY = true;
      return this;
   };

   WAMS.init.prototype = {
      /**
       * All multitouch events from Hammer
       * @type {string[]}
       */
      MTEvents: [
         "hold", "tap", "doubletap", "drag", "dragstart", "dragend", "dragup",
         "dragdown", "dragleft", "dragright", "swipe", "swipeup", "swipedown",
         "swipeleft", "swiperight", "transform", "transformstart", "transformend",
         "rotate", "pinch", "pinchin", "pinchout", "touch", "release"
      ],

      /**
       * Specify on which element multitouch is started
       * @param {HTMLElement|HTMLCollection|jQuery} elem HTML collection or jQuery array of elements
       */
      addMT: function(elem) {
         var self = this, newMTObj, i, len,
            addElement = function(elem) {
               newMTObj = new WAMS.modules.Hammer(elem, {
                  prevent_default: true,
                  no_mouseevents: true
               });
               self.MTObjects.push(newMTObj);
            };

         if (elem.length) {
            for (i = 0, len = elem.length; i < len; i++) {
               addElement(elem[i]);
            }
         } else {
            addElement(elem);
         }
      },

      // TODO check on idea of starting MT on body and only allowing
      // to interact with elements with certain selector
//      startMT: function (selector) {
//         new WAMS.modules.Hammer(document.body, {
//            prevent_default: true,
//            no_mouseevents: true
//         });
//         this.MTSelector = selector;
//      },

      /**
       * Send data to server through {@link WAMS.init#socket|socket}
       * @param {string} type Type of event created on server
       * @param {string|object} data Object to send
       */
      emit: function(type, data) {
         var self = this;
         this.socket.emit(type, {
            source: self.uuid,
            data: data
         });
      },

      /**
       * Register callback on specified event
       * @param {string|string[]} types On which types fire callback
       * @param {function} callback Function to execute
       */
      on: function(types, callback) {
         var self = this;
         types.split(' ').forEach(function(type) { // in case types is given as string of few events
            if (type === "shake") {
               window.addEventListener(type, callback, false);
            } else if (io_recv_calls.has(type)) { // one of internal events
               self.socket.on(type, function(data) {
                  callback(data.data);
               });
            } else if (self.MTEvents.indexOf(type) != -1) { // if this event is from hammer
               self.MTObjects.forEach(function (MTObj) { // to all mt objects we attach listener
                  MTObj.on(type, function (ev) { //listener callback
                     var touches = ev.gesture.touches;
                     var event = {
                           type: type,
                           element: []
                        };
                     for (var i = 0; i < touches.length; i++) {
                        var touch = touches[i];
                        var elementMetadata = {
                           tag: touch.target.tagName,
                           attributes: {},
                           innerHTML: touch.target.innerHTML,
                           x: touch.pageX,
                           y: touch.pageY
                        };
                        for (var j = 0, attrs = touch.target.attributes; j < attrs.length; j++) {
                           elementMetadata.attributes[attrs.item(j).nodeName] = attrs.item(j).nodeValue;
                        }
                        event.element.push(elementMetadata);
                     }
                     self.emit(type, event);

                     callback(ev);
                  });
               });
            } else {
               self.socket.on(type, function (data) {
                  callback(data);
               });
            }
         });
      },

      /**
       * Stop listening for events of these types
       * @param {string|string[]} types
       * @param {function} callback specify which function should be unsubscribed
       */
      off: function(types, callback) {
         var self = this;
         types.split(' ').forEach(function(type) { // in case types is given as string of few events
            if (type === "shake") {
               window.removeEventListener(type, callback, false);
            } else if (self.MTEvents.indexOf(type) != -1) {
               self.MTObjects.off(type, callback);
               self.socket.removeListener(type, callback);
            }
            else {
               self.socket.removeListener(type, callback);
            }
         });
      },

      /**
       * Register callback on event type from remote server
       * @param {string|string[]} types On which types fire callback
       * @param {function} callback Function to execute
       */
      onRemote: function(types, callback) {
         var self = this;
         self.emit(io_send_calls.subscribe_mt_event, {
            eventType: types
         });
         types.split(' ').forEach(function(type) {
            self.socket.on(type, function(data) {
               data.data.source = data.source;
               callback(data.data);
            });
         });
      },

      /**
       * Send message to specified clients through server
       * @param {string[]} targets Array of target uuids
       * @param {String|object} msg message
       */
      sendMSG: function(targets, msg) {
         var self = this;
         self.emit(io_send_calls.message_sent, {
            targets: targets,
            msg: msg
         });
      },

      /**
       * Send message to all clients through server
       * @param {String|object} msg message
       */
      broadcastMSG: function(msg) {
         var self = this;
         self.emit(io_send_calls.broadcast_sent, {
            msg: msg
         });
      },

      //FIXME rewrite better without return in the middle of for
      getDescription: function(uuid) {
         if (!isUUID(uuid)) {
//            console.error("Provide correct uuid");
            return undefined;
         }
         for (var i = 0; i < this.otherClients.length; i++) {
            if (this.otherClients[i].uuid === uuid) {
               return this.otherClients[i].description;
            }
         }
         return undefined;
      },

      front: function(callback) {
         var self = this;
         self.emit(io_send_calls.ask_front, {});
         self.on(io_recv_calls.get_front, function(users) {
            callback(users);
         });
      },

      left: function(callback) {
         var self = this;
         self.emit(io_send_calls.ask_left, {});
         self.on(io_recv_calls.get_left, function(users) {
            callback(users);
         });
      },

      right: function(callback) {
         var self = this;
         self.emit(io_send_calls.ask_right, {});
         self.on(io_recv_calls.get_right, function(users) {
            callback(users);
         });
      },

      behind: function(callback) {
         var self = this;
         self.emit(io_send_calls.ask_back, {});
         self.on(io_recv_calls.get_back, function(users) {
            callback(users);
         });
      }
   };

   /*
    //Shared dic
    var dic = {};
    this.socket.on("DIC_SNAPSHOT", function(data) {
    dic = data;
    });
    this.socket.on("DIC_UPDATE", function(data) {
    dic[data.attr] = data.value;
    console.log(dic);
    });
    console.log(dic);
    this.socket.emit("PUSH_TO_DIC", {
    attr: "uuid", value: this.uuid
    });
    dic["uuid"] = this.uuid;
    console.log(dic);
    //Shared dic end
    */

   // Taken from Hammer.js and modified
   // Based off Lo-Dash's excellent UMD wrapper (slightly modified) - https://github.com/bestiejs/lodash/blob/master/lodash.js#L5515-L5543
   // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
   if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
      // define as module
      define(["jquery", "hammer", "socket.io"],
         function ($, Hammer, io) {
            if (!WAMS.modules) {
               WAMS.modules = {};
            }
            WAMS.modules.$ = $;
            WAMS.modules.Hammer = Hammer;
            WAMS.modules.io = io;

            return WAMS;
         });
   }
   // Browserify support
   else if(typeof module === 'object' && typeof module.exports === 'object') {
      var $ = require('');
      var Hammer = require('hammerjs');
      var io = require('socket.io-client');

      if (!WAMS.modules) {
         WAMS.modules = {};
      }
      WAMS.modules.$ = $;
      WAMS.modules.Hammer = Hammer;
      WAMS.modules.io = io;

      module.exports = WAMS;
   }
   // If we have no plugins
   else {
      if (!WAMS.modules) {
         WAMS.modules = {};
      }
      WAMS.modules.$ = window.jQuery;
      WAMS.modules.Hammer = window.Hammer;
      WAMS.modules.io = window.io;

      window.WAMS = WAMS;
   }
}