requirejs.config({
   baseUrl: '/js/lib',
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
      , "ace": "ace/lib/ace"
      , "bcsocket": "/channel/bcsocket"
      , "shareJS": "sharejs/share"
      , "sharejs_textarea": "sharejs/textarea"
      , "sharejs_ace": "sharejs/ace"
   }
   , shim: {
      "bcsocket": {
         exports: "BCSocket"
      }
      , "shareJS": {
         exports: "sharejs"
         , deps: ["bcsocket"]
      }
      , "sharejs_textarea": {
         deps: ["shareJS"]
      }
      , "sharejs_ace": {
         deps: ["ace/ace", "shareJS"]
      }
   }
});

//requirejs(['jquery', 'wams', 'ace/ace', 'shareJS', 'bcsocket', 'shareJS_ace'],
requirejs(['jquery', 'wams', 'shareJS', 'bcsocket', 'sharejs_textarea'],
   function($, WAMS, sharejs) {
      var generateUUID = function() {
         return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
         });
      };
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

      wams.addMT($('.drag'));
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
            if (target[0].tagName.toLowerCase() === 'textarea') {
               target.focus();
            }
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
            //TODO cannot type because of this
   //         if (target[0].tagName.toLowerCase() === 'textarea') {
   //            target.blur();
   //         }
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
                  target.attr('data-chat', '');
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

                  var chatID = target.attr('data-chat-id'), index;
                  target.remove();

                  if (index = existingChats.indexOf(chatID) > 0) {
                     existingChats.splice(index, 1);
                     var moreChats = $('div[data-chat-id=' + chatID + ']');
                     if (moreChats.length > 0) {
                        var chat = $(moreChats[0]);
                        if (chat.attr('data-chat') !== 'open') {
                           var editor = chat.find('textarea')[0];
                           sharejs.open(chatID, 'text', function(error, doc) {
                              doc.attach_textarea(editor);
                              existingChats.push(chatID);
                           });
                        }
                     }
                  }
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

         var chatID = metadata.attributes['data-chat-id'];
         if (existingChats.indexOf(chatID) === -1) {
            existingChats.push(chatID);
            newElem.attr('data-chat', 'open');
            var editor = newElem.find('textarea')[0];
            sharejs.open(chatID, 'text', function(error, doc) {
               doc.attach_textarea(editor);
            });
         }
      }

      var chatIdentifier = generateUUID();
      var existingChats = [];

      $(document).ready(function() {
         $('.chattable').attr('data-chat-id', chatIdentifier);
      });

      var main_chat = document.getElementById('main-chat');
      sharejs.open(chatIdentifier, 'text', function(error, doc) {
         existingChats.push(chatIdentifier);
         doc.attach_textarea(main_chat);
      });
});
