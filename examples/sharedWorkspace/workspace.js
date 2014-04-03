/**
 * Create new workspace
 * @param {String} uuid UUID of workspace
 * @param {{width: number, height: number, x: number, y: number, scale: number}} screen Screen parameters
 * @constructor
 */
var Workspace = function(uuid, screen) {
   this.uuid = uuid;
   if (typeof screen === 'string') {
      screen = Workspace.decode(screen);
   }
   this.screen = screen;
};

/**
 * Compares to workspaces by UUID
 * @param {String|Workspace} workspace UUID or Workspace that we want to compare to
 * @returns {boolean} True if UUIDs are equal
 */
Workspace.prototype.equals = function(workspace) {
   if (typeof workspace === 'string') {
      return this.uuid === workspace;
   } else {
      return this.uuid === workspace.uuid;
   }
};

/**
 * Encode screen to simplified string to send over network
 * @param {{width: number, height: number, x: number, y: number, scale: number}} screen Screen parameters
 * @returns {string} Simplified string
 */
Workspace.encode = function(screen) {
   return screen.width + ':' + screen.height + ':' +
      screen.x + ':' + screen.y + ':' +
      screen.scale;
};

/**
 * Decode networked screen into useful object
 * @param {String} str Simplified string
 * @returns {{width: number, height: number, x: number, y: number, scale: number}} Decoded object
 */
Workspace.decode = function(str) {
   var splittedStr = str.split(':');

   return {
      width : +splittedStr[0],
      height : +splittedStr[1],
      x : +splittedStr[2],
      y : +splittedStr[3],
      scale : +splittedStr[4]
   }
};

module.exports = Workspace;
