var user = function(uuid, mode, description) {
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

module.exports = user;