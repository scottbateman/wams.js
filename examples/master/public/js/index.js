var socket = io();

$(document).ready(function() {
   var port, link, links = $('.link a');

   links.each(function() {
      link = $(this);
      port = link.attr('data-port');

      link.attr('href',  'http://' + location.hostname + ':' + port + '/');
      link.text(location.hostname + ':' + port);
   });
});