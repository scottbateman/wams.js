var user = function(uuid, socket, mode, description) {
   this.uuid = uuid;
   this.socket = socket;
   this.mode = mode;
   this.description = description;
   this.MTSubscription = [];
};

user.prototype.equals = function(user) {
   return (this.uuid === user.uuid);
};

user.prototype.subscribe = function(event) {
   this.MTSubscription.push(event);
};

user.prototype.copy = function() {
   var result = {};

   result.uuid = this.uuid;
   result.description = this.description;

   return result;
};

module.exports = user;