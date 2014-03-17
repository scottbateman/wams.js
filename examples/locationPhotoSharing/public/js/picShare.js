requirejs.config({
   baseUrl: '/js/lib',
   paths: {
      "jquery": "jquery-1.10.2",
      "hammer": "hammer",
      "socket.io": "/socket.io/socket.io",
      "shake": "shake"
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
   });

   var wams = new WAMS({
      color: color,
      name: name
   });

   wams.addMT(document.getElementsByClassName('drag'));
   wams.on('touch', onTouch);
   wams.on('drag', onDrag);
   wams.on('release', onRelease);

   function onTouch(ev) {
      var touches = ev.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
         var target = $(touches[t].target);
         $('.drag').css({ zIndex: 5 });
         target.css({ zIndex: 10 });
         target.attr('data-touchX', touches[t].pageX - target.offset().left);
         target.attr('data-touchY', touches[t].pageY - target.offset().top);
      }
   }
   function onDrag(ev) {
      var touches = ev.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
         var target = $(ev.target);

         if (target.hasClass('drag')) {
            target.css({
               left: touches[t].pageX - +target.attr('data-touchX'),
               top: touches[t].pageY - +target.attr('data-touchY')
            });
         }
      }
   }
   function onRelease(ev) {
      var touches = ev.gesture.touches;
      for (var t = 0; t < touches.length; t++) {
         var target = $(touches[t].target);
         var touchX = +target.attr('data-touchX');
         var touchY = +target.attr('data-touchY');
         target.attr('data-touchX', "");
         target.attr('data-touchY', "");
      }
   }
});
