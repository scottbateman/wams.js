/**
 * Create new storage of {@linkcode user} objects
 * @constructor
 */
var vault = function() {
   /**
    * Amount of users saved in {@linkcode vault}
    * @type {number}
    */
   this.length = 0;
};

/**
 * Add new object to vault
 * @param {user} user object to add
 */
vault.prototype.push = function(user) {
   this[this.length] = user;
   this.length++;
};

/**
 * Return and delete object from {@linkcode vault}
 * @param {user} user {@linkcode user|User} to pop
 * @returns {user} User object
 */
vault.prototype.pop = function(user) {
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

/**
 * Export list of significant data from {@linkcode user} objects except specified user.
 * Uses {@linkcode user#copyForNetwork} to export data
 * @param {user} user {@link user|User} object to exclude
 * @returns {Array} Array of objects with important data from {@linkcode user} except specified user
 */
vault.prototype.networkExportExcept = function(user) {
   var list = [];
   for (var i = 0; i < this.length; i++) {
      if (!this[i].equals(user)) {
         list.push(this[i].copyForNetwork());
      }
   }
   return list;
};

/**
 * Export list of significant data from {@linkcode user} objects.
 * Uses {@linkcode user#copyForNetwork} to export data
 * @returns {Array} Array of objects with important data from {@linkcode user}
 */
vault.prototype.networkExportAll = function() {
   var list = [];
   for (var i = 0; i < this.length; i++) {
      list.push(this[i].copyForNetwork());
   }
   return list;
};

/**
 * Get {@linkcode user} object by {@linkcode user#uuid|uuid}
 * @param {string} uuid Identifier of {@linkcode user}
 * @returns {user|undefined} {@linkcode user} object or undefined
 */
vault.prototype.get = function(uuid) {
   for (var i = 0; i < this.length; i++) {
      if (this[i].uuid === uuid) {return this[i];}
   }
   return undefined;
};

module.exports = vault;