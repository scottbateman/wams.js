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
   wams.on('release', onRelease);
   wams.onRemote('touch', onRemoteTouch);
   wams.onRemote("drag transform", onRemoteDrag);
   wams.onRemote('release', onRemoteRelease);

   function onTouch(ev) {
      var touches = ev.originalEvent.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
         var target = $(touches[t].target);
         if (isUnlocked(target, wams.uuid)) {
            lock(target);
            liftZindex(target, 10);
            target.attr('data-touchX', touches[t].pageX - target.offset().left);
            target.attr('data-touchY', touches[t].pageY - target.offset().top);
         }
      }
   }
   function onRemoteTouch(data) {
      data.element.forEach(function(element) {
         var ball = $('#' + element.id);
         if (isUnlocked(ball, data.source)) {
            lock(ball, data.source);
            liftZindex(ball, 5);
            ball.attr('data-touchX', element.x - ball.offset().left);
            ball.attr('data-touchY', element.y - ball.offset().top);
         }
      });
   }
   function onDrag(ev) {
      var touches = ev.originalEvent.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
         var target = $(touches[t].target);
//         var target = $(ev.target);
         if (isUnlocked(target, wams.uuid)) {
            moveElement(target, touches[t].pageX, touches[t].pageY);
         }
      }
   }
   function onRemoteDrag(data) {
      data.element.forEach(function(element) {
         var ball = $('#' + element.id);
         if (isUnlocked(ball, data.source)) {
            moveElement(ball, element.x, element.y);
         }
      });
   }
   function onRelease(ev) {
      var touches = ev.originalEvent.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
         var target = $(touches[t].target);
         if (isUnlocked(target, wams.uuid)) {
            unlock(target);
            lowerZindex(target);
            target.attr('data-touchX', "");
            target.attr('data-touchY', "");
         }
      }
   }
   function onRemoteRelease(data) {
      data.element.forEach(function(element) {
         var ball = $('#' + element.id);
         if (isUnlocked(ball, data.source)) {
            unlock(ball);
            lowerZindex(ball);
            ball.attr('data-touchX', "");
            ball.attr('data-touchY', "");
         }
      })
   }

   function liftZindex(elem, num) {
//      $('.drag').css({ zIndex: 5 });
      if (typeof num === 'undefined') {
         num = 10
      }
      elem.css({ zIndex: num });
   }
   function lowerZindex(elem, num) {
      if (typeof num === 'undefined') {
         num = 1;
      }
      elem.css({ zIndex: num });
   }
   function moveElement(elem, x, y) {
      if (elem.hasClass('drag')) {
         elem.css({
            left: x - +elem.attr('data-touchX'),
            top: y - +elem.attr('data-touchY')
         });
      }
   }
   function lock(elem, uuid) {
      elem.attr('data-lock', uuid || wams.uuid);
   }
   function unlock(elem) {
      elem.attr('data-lock', "");
   }
   function isUnlocked(elem, uuid) {
      return (elem.attr('data-lock') === "") ||
         (elem.attr("data-lock") === uuid);
   }
});
