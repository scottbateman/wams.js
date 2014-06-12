var Vault = require('./node_modules/wams.js-server/src/vault');
var Screen = require('./screen');

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
 * @param {Screen.screen} screen Screen parameters
 * @returns {Screen.screen} Adjusted workspace
 */
WorkspaceManager.prototype.addScreen = function(uuid, screen) {
   var screen = new Screen(uuid, screen);

   if (this._vault.length >= 1) {
      var lastScreen = this._vault[this._vault.length - 1],
         lastWidth = lastScreen.screen.width,
         lastX = lastScreen.screen.x;

      screen.screen.x = lastX + lastWidth;
   }

   this._vault.push(screen);
   return screen.screen;
};

/**
 * Returns dimensions of screen by UUID
 * @param {String} uuid UUID of screen
 * @returns {Screen.screen} Screen dimensions
 */
WorkspaceManager.prototype.getScreen = function(uuid) {
   var screen = this._vault.get(uuid);
   return screen.screen;
};

/**
 * Resizes screen of workspace
 * @param {String} uuid UUID of workspace
 * @param {number} width New width
 * @param {number} height New height
 */
WorkspaceManager.prototype.resize = function(uuid, width, height) {
   var screen = this._vault.get(uuid),
      screenX = screen.screen.x,
      screenWidth = screen.screen.width,
      i, len;
   screen.screen.width = width;
   screen.screen.height = height;

   for (i = 0, len = this._vault.length; i < len; i++) {
      if (this._vault[i].screen.x >= screenX + screenWidth) {
         this._vault[i].screen.x -= screenWidth - width;

         this._wams.emit('adjust_workspace', this._vault[i].uuid, {
            screen: Screen.encode(this._vault[i].screen)
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
            screen: Screen.encode(this._vault[i].screen)
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

/**
 * Return width and height of the whole workspace
 * @returns {{width: number, height: number}} maximum width and height of workspace
 */
WorkspaceManager.prototype.maxDimensions = function() {
   var result = {}, i, len, screen;

   if (!this._vault.length) {
      return {
         width: 0,
         height: 0
      };
   }

   screen = this._vault[0].screen;
   result.width = screen.x + screen.width;
   result.height = screen.y + screen.height;

   for (i = 1, len = this._vault.length; i < len; i++) {
      screen = this._vault[i].screen;
      if (screen.x + screen.width > result.width) {
         result.width = screen.x + screen.width;
      }
      if (screen.y + screen.height > result.height) {
         result.height = screen.y + screen.height;
      }
   }

   return result;
};

module.exports = exports = WorkspaceManager;
