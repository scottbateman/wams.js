var workspace = function(uuid, screen) {
   this.uuid = uuid;
   if (typeof screen === 'string') {
      screen = workspace.decode(screen);
   }
   this.screen = screen;
};

workspace.prototype.equals = function(workspace) {
   if (typeof workspace === 'string') {
      return this.uuid === workspace;
   } else {
      return this.uuid === workspace.uuid;
   }
};

workspace.encode = function(screen) {
   return screen.width + ':' + screen.height + ':' +
      screen.x + ':' + screen.y + ':' +
      screen.scale;
};

workspace.decode = function(str) {
   var splittedStr = str.split(':');

   return {
      width : +splittedStr[0],
      height : +splittedStr[1],
      x : +splittedStr[2],
      y : +splittedStr[3],
      scale : +splittedStr[4]
   }
};

module.exports = workspace;
