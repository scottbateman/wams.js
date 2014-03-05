requirejs.config({
   baseUrl: 'js/lib',
   paths: {
      //paths are relative to baseUrl
      "jquery": [
         "//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min",
         //If CDN fails, load from local file
         "jquery-1.10.2"
      ]
      , "hammer": "hammer"
      , "socket.io": "/socket.io/socket.io"
      , "shake": "shake"
   }
});

requirejs(['jquery', 'wams'], function($, WAMS) {
   var wams = new WAMS();
});
