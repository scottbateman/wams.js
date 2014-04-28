/**
 * Create new workspace
 * @param {String} uuid UUID of workspace
 * @param {{width: number, height: number, x: number, y: number, scale: number}} screen Screen parameters
 * @constructor
 */
var Screen = function(uuid, screen) {
   this.uuid = uuid;
   if (typeof screen === 'string') {
      screen = Screen.decode(screen);
   }
   this.screen = screen;
};

/**
 * Compares to workspaces by UUID
 * @param {String|Screen} screen UUID or Screen that we want to compare to
 * @returns {boolean} True if UUIDs are equal
 */
Screen.prototype.equals = function(screen) {
   if (typeof screen === 'string') {
      return this.uuid === screen;
   } else {
      return this.uuid === screen.uuid;
   }
};

/**
 * Encode screen to simplified string to send over network
 * @param {{width: number, height: number, x: number, y: number, scale: number}} screen Screen parameters
 * @returns {string} Simplified string
 */
Screen.encode = function(screen) {
   return screen.width + ':' + screen.height + ':' +
      screen.x + ':' + screen.y + ':' +
      screen.scale;
};

/**
 * Decode networked screen into useful object
 * @param {String} str Simplified string
 * @returns {{width: number, height: number, x: number, y: number, scale: number}} Decoded object
 */
Screen.decode = function(str) {
   var splittedStr = str.split(':');

   return {
      width : +splittedStr[0],
      height : +splittedStr[1],
      x : +splittedStr[2],
      y : +splittedStr[3],
      scale : +splittedStr[4]
   }
};

module.exports = Screen;
