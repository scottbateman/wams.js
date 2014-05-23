var racer = require('racer');
var $ = require('jquery');
var wams = require('wams');

var rndColor = (function() {
   var bg_colour = Math.floor(Math.random() * 16777215).toString(16);
   bg_colour = "#"+("000000" + bg_colour).slice(-6);
   return bg_colour;
}());
var rndName = (function() {
   var sampleNames = [
      'Fe', 'Thomas', 'Kirstie', 'Wynell', 'Mario', 'Aretha', 'Cherryl', 'Ta',
      'Lindy', 'Karina', 'Sacha', 'Latesha', 'Miki', 'Janel', 'Leola', 'Romeo',
      'Roderick', 'Felica', 'Ilona', 'Nila', 'Patrina', 'Wes', 'Henry', 'Elvera',
      'Karrie', 'Jacklyn', 'Alethea', 'Emogene', 'Alphonso', 'Chandra', 'Beryl',
      'Lilly', 'Georgetta', 'Darrin', 'Deane', 'Rocio', 'Charissa', 'Simona',
      'Don', 'Arianne', 'Esther', 'Leonia', 'Karma', 'Rosemarie', 'Carolyn',
      'Miriam', 'Chastity', 'Vesta', 'Christian', 'Lashaun'
   ].sort();

   return sampleNames[Math.floor(Math.random() * sampleNames.length)];
}());

function displayScreenMode(screen) {
   var screenMode = $('#mode');
   screenMode.text(screen.w + 'x' + screen.h +
      (screen.x >= 0 ? '+' + screen.x : "" + screen.x) +
      (screen.y >= 0 ? '+' + screen.y : "" + screen.y) + ':' +
      screen.s
   );
}




function showBalls(elements) {
   elements.forEach(function (element) {
      var elem = document.createElement(element.tag),
         attr;
      for (attr in element.attributes) {
         if (element.attributes.hasOwnProperty(attr)) {
            elem.setAttribute(attr, element.attributes[attr]);
         }
      }
      elem.innerHTML = element.innerHTML || "";

      var body = document.getElementsByTagName('body')[0];
      body.appendChild(elem);
   });
}

racer.ready(function(model) {
   var room = 'sharedWorkspace';
   model.subscribe(room, function() {
      window.model = model;
      // model = model.at('sharedWorkspace');

      var id = model.id();
      model.add(room + '.users', {
         id: id,
         color: rndColor,
         name: rndName
      });
      model.add(room + '.screens', {
         id: id,
         w: window.innerWidth,
         h: window.innerHeight,
         x: 0,
         y: 0,
         s: 1
      });
      model.ref('_page.me', room + '.users.' + id);
      model.ref('_page.screen', room + '.screens.' + id);
      model.ref('_page.workspace', room + '.workspace');
      model.ref('_page.elements', room + '.elements');

      // model.on('all', function() {
      //    console.log(arguments);
      // });

      window.onbeforeunload = function() {
         model.del(room + '.users.' + id);
         model.del(room + '.screens.' + id);
      };

      $(document).ready(function() {
         var userID = $('#userID');
         userID.text( model.get('_page.me.name') );
         userID.css({ background: model.get('_page.me.color') });

         displayScreenMode( model.get('_page.screen') );
         showBalls( model.get(room + '.elements') );
      });

      $(window).resize(function() {
         model.set('_page.screen.w', window.innerWidth);
         model.set('_page.screen.h', window.innerHeight);

         displayScreenMode( model.get('_page.screen') );
      });

//       model.on('change', '_page.workspace**', function(changed) {
//          var path = '_page.workspace.' + changed[0],
//             newValue = changed[1],
//             oldValue = changed[2],
//             ctx = document.getElementById('minimap').getContext('2d');
//
//             ctx.translate(0.5, 0.5);
//
//       });
   });
});

