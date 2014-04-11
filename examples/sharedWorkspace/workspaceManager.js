var Vault = require('./node_modules/wams.js-server/src/vault');
var Workspace = require('./workspace');

/**
 * Start workspace manager
 * @param wams Reference to wams library
 * @constructor
 */
var WorkspaceManager = function(wams) {
   this._wams = wams;
   this._vault = new Vault();
};

/**
 * Adds new screen to manager
 * @param {String} uuid UUID of workspace
 * @param {Workspace.screen} screen Screen parameters
 * @returns {Workspace.screen} Adjusted workspace
 */
WorkspaceManager.prototype.addScreen = function(uuid, screen) {
   var workspace = new Workspace(uuid, screen);

   if (this._vault.length >= 1) {
      var lastWorkspace = this._vault[this._vault.length - 1],
         lastWidth = lastWorkspace.screen.width,
         lastX = lastWorkspace.screen.x;

      workspace.screen.x = lastX + lastWidth;
   }

   this._vault.push(workspace);
   return workspace.screen;
};

/**
 * Returns screen of given workspace
 * @param {String} uuid UUID of workspace
 * @returns {Workspace.screen} Screen object
 */
WorkspaceManager.prototype.getScreen = function(uuid) {
   var workspace = this._vault.get(uuid);
   return workspace.screen;
};

/**
 * Resizes screen of workspace
 * @param {String} uuid UUID of workspace
 * @param {number} width New width
 * @param {number} height New height
 */
WorkspaceManager.prototype.resize = function(uuid, width, height) {
   var workspace = this._vault.get(uuid),
      workspaceX = workspace.screen.x,
      workspaceWidth = workspace.screen.width,
      i, len;
   workspace.screen.width = width;
   workspace.screen.height = height;

   for (i = 0, len = this._vault.length; i < len; i++) {
      if (this._vault[i].screen.x >= workspaceX + workspaceWidth) {
         this._vault[i].screen.x -= workspaceWidth - width;

         this._wams.emit('adjust_workspace', this._vault[i].uuid, {
            screen: Workspace.encode(this._vault[i].screen)
         });
      }
   }
};

/**
 * Delete screen with given uuid. This method moves all screens that were on
 * the right of workspace that is being deleted.
 * @param {String} uuid UUID of workspace
 */
WorkspaceManager.prototype.deleteScreen = function(uuid) {
   var toDelete = this._vault.pop(uuid),
      toDeleteWidth = toDelete.screen.width,
      toDeleteX = toDelete.screen.x,
      i, len;

   for (i = 0, len = this._vault.length; i < len; i++) {
      if (this._vault[i].screen.x >= toDeleteX + toDeleteWidth) {
         this._vault[i].screen.x -= toDeleteWidth;

         this._wams.emit('adjust_workspace', this._vault[i].uuid, {
            screen: Workspace.encode(this._vault[i].screen)
         });
      }
   }
};

/**
 * Function return list of workspaces above which this point is
 * @param {number} x x coordinate of point
 * @param {number} y y coordinate of point
 * @returns {Array} workspaces under point
 */
WorkspaceManager.prototype.under = function(x, y) {
   var result = [], i, len, uuid, screen;

   for (i = 0, len = this._vault.length; i < len; i++) {
      uuid = this._vault[i].uuid;
      screen = this._vault[i].screen;
      if (screen.x <= x && x <= screen.x + screen.width &&
         screen.y <= y && y <= screen.y + screen.height) {
         result.push(uuid);
      }
   }

   return result;
};

/**
 * Return list of elements in vault but not in the list provided
 * @param {Array} list list of elements that are skipped
 * @returns {Array} filtered elements
 */
WorkspaceManager.prototype.allExcept = function(list) {
   var result = [], i, len, uuid;

   for (i = 0, len = this._vault.length; i < len; i++) {
      uuid = this._vault[i].uuid;
      if (list.indexOf(uuid) === -1) {
         result.push(uuid);
      }
   }

   return result;
};

module.exports = exports = WorkspaceManager;
