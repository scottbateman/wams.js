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
   var rndColor = function() {
      var bg_colour = Math.floor(Math.random() * 16777215).toString(16);
      bg_colour = "#"+("000000" + bg_colour).slice(-6);
      return bg_colour;
   };
   var sampleNames = [
      'Fe', 'Thomas', 'Kirstie', 'Wynell', 'Mario', 'Aretha', 'Cherryl', 'Ta',
      'Lindy', 'Karina', 'Sacha', 'Latesha', 'Miki', 'Janel', 'Leola', 'Romeo',
      'Roderick', 'Felica', 'Ilona', 'Nila', 'Patrina', 'Wes', 'Henry', 'Elvera',
      'Karrie', 'Jacklyn', 'Alethea', 'Emogene', 'Alphonso', 'Chandra', 'Beryl',
      'Lilly', 'Georgetta', 'Darrin', 'Deane', 'Rocio', 'Charissa', 'Simona',
      'Don', 'Arianne', 'Esther', 'Leonia', 'Karma', 'Rosemarie', 'Carolyn',
      'Miriam', 'Chastity', 'Vesta', 'Christian', 'Lashaun'
   ].sort();
   var name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
   var color = rndColor();

   $(document).ready(function() {
      var userID = $('#userID');
      userID.text(name);
      userID.css({ background: color });

      $('.id').text(name);
   });

   var wams = new WAMS({
      color: color,
      name: name,
      path: window.location.pathname
   });

   wams.addMT($('.drag'));

   wams.on('touch', onTouch);
   wams.on('drag transform', onDrag);
   wams.onRemote('touch', onRemoteTouch);
   wams.onRemote("drag transform", onRemoteDrag);

   function onTouch(ev) {
      var touches = ev.originalEvent.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
         var target = $(touches[t].target);
         liftZindex(target);
      }
   }
   function onRemoteTouch(data) {
      data.element.forEach(function(element) {
         var ball = $('#' + element.id);
         liftZindex(ball);
      });
   }
   function onDrag(ev) {
      var touches = ev.originalEvent.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
//         var target = $(touches[t].target);
         var target = $(ev.target);
         moveElement(target, touches[t].pageX, touches[t].pageY);
      }
   }
   function onRemoteDrag(data) {
      data.element.forEach(function(element) {
         var ball = $('#' + element.id);
         moveElement(ball, element.x, element.y);
      });
   }

   function liftZindex(elem) {
      $('.drag').css({ zIndex: 5 });
      elem.css({ zIndex: 10 });
   }
   function moveElement(elem, x, y) {
      if (elem.hasClass('drag')) {
         elem.css({
            left: x - elem.width() / 2,
            top: y - elem.height() / 2
         });
      }
   }
});
