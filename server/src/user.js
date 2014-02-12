/**
 * Create new user
 * @param {string} uuid
 * @param {socket_io.Socket} socket
 * @param {string} mode Mode set for user
 * @param {{}} description Description object of the user
 * @constructor
 */
var user = function(uuid, socket, mode, description) {
   /**
    * Unique identifier of {@linkcode user}
    * @type {string}
    */
   this.uuid = uuid;
   /**
    * Socket to this client
    * @type {socket_io.Socket}
    */
   this.socket = socket;
   this.mode = mode;
   /**
    * Description of {@linkcode user} provided by client at connection time
    * @type {{}}
    */
   this.description = description;
   /**
    * List of multi-touch events to which this user is subscribed
    * @type {Array}
    */
   this.MTSubscription = [];
};

/**
 * Check if {@link user} and parameter are the same object
 * @param {user|string} user {@link user|User} object or UUID string to check
 * @returns {boolean} true if current object and parameter are equal
 */
user.prototype.equals = function(user) {
   if (typeof user === 'string')
      return (this.uuid === user);
   else
      return (this.uuid === user.uuid);
};

/**
 * Subscribe this user to Multi-touch event from remote
 * @param {string} event Event name
 */
user.prototype.subscribe = function(event) {
   this.MTSubscription.push(event);
   this.socket.join(event);
};

/**
 * Export object with significant data that can be JSON.stringified
 * @returns {{}} Significant data of current {@link user user}
 */
user.prototype.copy = function() {
   var result = {};

   result.uuid = this.uuid;
   result.description = this.description;

   return result;
};

module.exports = user;