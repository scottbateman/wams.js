requirejs.config({
   baseUrl: 'js/lib',
   paths: {
      //paths are relative to baseUrl
      "jquery": [
         "jquery-1.10.2"
         //If local file fails, load from CDN
         , "//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min"
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
//   setTimeout(function() {
//      console.log(wams.uuid);
//   }, 500);

   function updateBar() {
      var dropArea = $('#drop-area');
      dropArea.find('div').remove();
      for (var i = 0, len = wams.otherClients.length; i < len; i++) {
         var newUserDropArea = $(document.createElement('div'));
         newUserDropArea.addClass('drop');
         newUserDropArea.attr('data-target', wams.otherClients[i].uuid);
         newUserDropArea.css({ background: wams.otherClients[i].description.color });

         var newUserText = $(document.createElement('p'));
         newUserText.text(wams.otherClients[i].description.name);
         newUserDropArea.append(newUserText);

         dropArea.append(newUserDropArea);
         var useHeight = (100 / wams.otherClients.length) + '%';
         dropArea.find('div').css({ height: useHeight });
      }
   }
   wams.on([WAMS.when.connection_ok,
           WAMS.when.user_connected,
           WAMS.when.user_disconnected].join(" "), updateBar);

//   setTimeout(function() {
//      wams.sendMSG([wams.otherClients[0].uuid], {msg: "hello", metadata: true});
//      wams.broadcastMSG({msg: "hello", metadata: true});
//   }, 1000);
//   wams.on(WAMS.when.broadcast_received, function(data) {
//      console.log(data);
//   });

//   wams.addMT(".drag");
   wams.addMT($('.drag'));
//   wams.addMT(document.getElementsByClassName("drag"));

   wams.on('touch', onTouch);
   wams.on('drag', onDrag);
   wams.on('release', onRelease);
   wams.on(WAMS.when.message_received, function(data) {
      switch (data.action) {
         case "new_element":
            new_element(data.element);
            break;
      }
   });

   function onTouch(ev) {
      var touches = ev.originalEvent.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
         var target = $(touches[t].target);
         $('.drag').css({ zIndex: 5 });
         target.css({ zIndex: 10 });
         target.attr('data-touchX', touches[t].pageX - target.offset().left);
         target.attr('data-touchY', touches[t].pageY - target.offset().top);
      }
   }
   function onDrag(ev) {
      var touches = ev.originalEvent.gesture.touches;
      for (var t = 0, len = touches.length; t < len; t++) {
//         var target = $(touches[t].target);
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
      var touches = ev.originalEvent.gesture.touches;
//      console.log(touches.length);
      for (var t = 0; t < touches.length; t++) {
         var target = $(touches[t].target);
         var touchX = +target.attr('data-touchX');
         var touchY = +target.attr('data-touchY');
         target.attr('data-touchX', "");
         target.attr('data-touchY', "");

         if (target.hasClass('drag')) {
            var targetCenter = {
               x: target.offset().left + touchX,
               y: target.offset().top + touchY
            };
            var where;
            var dropAreas = $('#drop-area').find('div');
            for (var i = 0; i < dropAreas.length
               && typeof where === 'undefined'; i++) {
               var drop = $(dropAreas[i]);
               if (drop.offset().left <= targetCenter.x &&
                  targetCenter.x <= drop.offset().left + drop.width() &&
                  drop.offset().top <= targetCenter.y &&
                  targetCenter.y <= drop.offset().top + drop.height()) {
                  where = drop.attr("data-target");
               }
            }
            if (typeof where === 'string') {
               var msg = {
                  action: 'new_element',
                  element: {
                     tag: target[0].tagName,
                     attributes: {},
                     innerHTML: target[0].innerHTML,
                     relHeight: ( targetCenter.y / $(window).height() )
                  }
               };
               for (var j = 0, attrs = target[0].attributes; j < attrs.length; j++) {
                  msg.element.attributes[attrs.item(j).nodeName] = attrs.item(j).nodeValue;
               }
               wams.sendMSG([where], msg);
               target.remove();
            }
         }
      }
   }
   function new_element(metadata) {
      var newElem = $(document.createElement(metadata.tag));
      newElem.html(metadata.innerHTML);
      for (var attribute in metadata.attributes) {
         newElem.attr(attribute, metadata.attributes[attribute]);
      }

      $("body").append(newElem);
      wams.addMT(newElem);
      wams.on('touch', onTouch);
      wams.on('drag', onDrag);
      wams.on('release', onRelease);

      var fuzziness = 1 + 25;
      var rndLeft = Math.floor(Math.random() * fuzziness - 5);
      newElem.css({
         top: ( metadata.relHeight * $(window).height() - newElem.height() / 2 ),
         left: ( $(window).width() - $('#drop-area').width() - newElem.width() + rndLeft )
      });
   }

   wams.emit('my_hello_324', {data: "hello"});
   wams.on('my_hello_325', function(data) {
      console.log(data);
   });
//   wams.onRemote('drag', function(data) {
//      console.log(data);
//   });
//   wams.on("shake", function(data) {
//      console.log('Undo?');
//   });

//   window.sess = wams;
//   window.Session = WAMS;

   /*
   //FIXME check error with drag when element jumps to new location
   wams.on('pinchout', function(ev) {
      var target = $(ev.target);

      var centerX = +target.css('width').split('').slice(0,-2).join('') / 2 + +target.offset().left;
      var centerY = +target.css('height').split('').slice(0,-2).join('') / 2+ +target.offset().top;
      var scale = ev.originalEvent.gesture.scale;
      var newWidth = +target.css('width').split('').slice(0,-2).join('') * (1 + scale / 50);
      var newHeight = +target.css('height').split('').slice(0,-2).join('') * (1 + scale / 50);
      var newPosX = centerX - newWidth / 2;
      var newPosY = centerY - newHeight / 2;
      var newBorderRadius = newWidth / 2;

      target.css({
         left: newPosX + 'px',
         top: newPosY + 'px',
         width: newWidth + 'px',
         height: newHeight + 'px',
         borderRadius: newBorderRadius + 'px'
      });
   });
   wams.on('pinchin', function(ev) {
      var target = $(ev.target);

      var centerX = +target.css('width').split('').slice(0,-2).join('') / 2 + +target.offset().left;
      var centerY = +target.css('height').split('').slice(0,-2).join('') / 2+ +target.offset().top;
      var scale = ev.originalEvent.gesture.scale;
      var newWidth = +target.css('width').split('').slice(0,-2).join('') * (1 - scale / 20);
      var newHeight = +target.css('height').split('').slice(0,-2).join('') * (1 - scale / 20);
      var newPosX = centerX - newWidth / 2;
      var newPosY = centerY - newHeight / 2;
      var newBorderRadius = newWidth/2;

      target.css({
         left: newPosX + 'px',
         top: newPosY + 'px',
         width: newWidth + 'px',
         height: newHeight + 'px',
         borderRadius: newBorderRadius + 'px'
      });
   });
   */
});
