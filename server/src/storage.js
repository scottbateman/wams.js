var storage = function() {
   this.length = 0;
};

storage.prototype.push = function(user) {
   this[this.length] = user;
   this.length++;
};

storage.prototype.pop = function(user) {
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

storage.prototype.exportExcept = function(user) {
   var list = [];
   for (var i = 0; i < this.length; i++) {
      if (!this[i].equals(user)) {
         list.push(this[i].copy());
      }
   }
   return list;
};

storage.prototype.exportAll = function() {
   var list = [];
   for (var i = 0; i < this.length; i++) {
      list.push(this[i].copy());
   }
   return list;
};

storage.prototype.get = function(uuid) {
   for (var i = 0; i < this.length; i++) {
      if (this[i].uuid === uuid) {return this[i];}
   }
   return undefined;
};

module.exports = storage;