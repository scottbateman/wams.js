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
 * @returns {user|undefined} User object
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
 * Returns snapshot of vault. This snapshot is not updated, when vault is updated
 * @returns {Array} Array of user copies
 */
vault.prototype.localExport = function() {
   var obj = [];
   for (var i = 0; i < this.length; i++) {
      obj.push(this[i].copyForLocal());
   }
   return obj;
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