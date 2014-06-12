var Vault = require('./node_modules/wams.js-server/src/vault');
var Workspace = require('./workspace');


var WorkspaceManager = function(wams) {
   this._wams = wams;
   this._vault = new Vault();
};

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

WorkspaceManager.prototype.resize = function(uuid, width, height) {
   var workspace = this._vault.get(uuid),
      workspaceX = workspace.screen.x,
      workspaceWidth = workspace.screen.width;
   workspace.screen.width = width;
   workspace.screen.height = height;

   for (var i = 0; i < this._vault.length; i++) {
      if (this._vault[i].screen.x >= workspaceX + workspaceWidth) {
         this._vault[i].screen.x -= workspaceWidth - width;

         this._wams.emit('adjust_workspace', this._vault[i].uuid, {
            screen: Workspace.encode(this._vault[i].screen)
         });
      }
   }
};

WorkspaceManager.prototype.deleteScreen = function(uuid) {
   var toDelete = this._vault.pop(uuid),
      toDeleteWidth = toDelete.screen.width,
      toDeleteX = toDelete.screen.x;

   for (var i = 0; i < this._vault.length; i++) {
      if (this._vault[i].screen.x >= toDeleteX + toDeleteWidth) {
         this._vault[i].screen.x -= toDeleteWidth;

         this._wams.emit('adjust_workspace', this._vault[i].uuid, {
            screen: Workspace.encode(this._vault[i].screen)
         });
      }
   }
};

module.exports = exports = WorkspaceManager;
