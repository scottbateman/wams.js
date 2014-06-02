//var locations = (function() {
//   var MAX_LENGTH = 4;
//   var positions = [];
//   var next_available = 0;
//
//   function _findNextAvailableSpot(fromID) {
//      fromID++;
//      while (typeof positions[fromID] !== 'undefined') {
//         fromID++;
//      }
//      return fromID;
//   }
//
//   function addClient(uuid) {
//      positions[next_available] = uuid;
//      var prev_pos = next_available;
//      next_available = _findNextAvailableSpot(next_available);
//      return prev_pos;
//   }
//
//   function deleteClient(pos) {
//      var client = positions[pos];
//      delete positions[pos];
//      if (next_available > pos) next_available = pos;
//      return client;
//   }
//
//   function getClient(pos) {
//      return positions[pos];
//   }
//
//   function getPosition(uuid) {
//      var pos;
//      for (var i = 0, len = positions.length; i < len &&
//         typeof pos === 'undefined'; i++) {
//         if (positions[i] === uuid) {
//            pos = i;
//         }
//      }
//      return pos;
//   }
//
//   function isEmpty() {
//      return positions.length === 0;
//   }
//
//   return {
//      addClient: addClient
//      , deleteClient: deleteClient
//      , getClient: getClient
//      , getPosition: getPosition
//      , isEmpty: isEmpty
//   }
//})();

/*
Positions are:     Their directions are:
                    pointing the middle
   |-0-|-1-|            | \ | / |
   |-2-|-3-|            | / | \ |
 */
var locations = function() {
   this.positions = [];
   this._next_available = 0;
};

locations.prototype._findNextAvailableSpot = function(fromID) {
   while (typeof this.positions[fromID] !== 'undefined') {
      fromID++;
   }
   return fromID;
};

locations.prototype.addClient = function(uuid) {
   this.positions[this._next_available] = uuid;
   var prev_pos = this._next_available;
   this._next_available = this._findNextAvailableSpot(this._next_available);
   return prev_pos;
};

locations.prototype.deleteClient = function(pos) {
   var client = this.positions[pos];
   delete this.positions[pos];
   if (this._next_available > pos) this._next_available = pos;
   return client;
};

locations.prototype.getClient = function(pos) {
   return this.positions[pos];
};

locations.prototype.getPosition = function(uuid) {
   var pos = -1;
   for (var i = 0, len = this.positions.length; i < len &&
      typeof pos === 'undefined'; i++) {
      if (this.positions[i] === uuid) {
         pos = i;
      }
   }
   return pos;
};

locations.prototype.toLeftFrom = function(pos) {
   var uuid = [], client;
   switch(pos) {
      case 0:
         client = this.getClient(1);
         break;
      case 1:
         client = this.getClient(3);
         break;
      case 2:
         client = this.getClient(0);
         break;
      case 3:
         client = this.getClient(2);
         break;
   }
   if (client) uuid.push(client);
   return uuid;
};

locations.prototype.toRightFrom = function(pos) {
   var uuid = [], client;
   switch(pos) {
      case 0:
         client = this.getClient(2);
         break;
      case 1:
         client = this.getClient(0);
         break;
      case 2:
         client = this.getClient(3);
         break;
      case 3:
         client = this.getClient(1);
         break;
   }
   if (client) uuid.push(client);
   return uuid;
};

locations.prototype.inFrontOf = function(pos) {
   var uuid = [], client;
   switch(pos) {
      case 0:
         client = this.getClient(3);
         break;
      case 1:
         client = this.getClient(2);
         break;
      case 2:
         client = this.getClient(1);
         break;
      case 3:
         client = this.getClient(0);
         break;
   }
   if (client) uuid.push(client);
   return uuid;
};

locations.prototype.behind = function(pos) {
   return [];
};

locations.prototype.isEmpty = function() {
   return this.positions.length === 0;
};

module.exports = locations;
