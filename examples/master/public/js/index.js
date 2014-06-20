var START_BTN_LABEL = 'Start example',
   STOP_BTN_LABEL = 'Stop example',
   STATE_LABEL_PRE = 'State: ',
   PID_LABEL_PRE = 'PID: ';

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

$('.start_stop_btn').click(function(ev) {
   var btn = $(this),
      id = btn.attr('data-id'),
      isStartBtn = (btn.attr('data-start-btn') === 'true');

   socket.emit(isStartBtn ? 'start' : 'stop', id);
});

$('.restart_btn').click(function(ev) {
   var id = $(this).attr('data-id');

   socket.emit('restart', id);
});

socket.on('started', function(data) {
   var state = $('#' + data.id + ' .state'),
      pid = $('#' + data.id + ' .pid'),
      link = $('#' + data.id + ' a'),
      startStopBtn = $('#' + data.id + ' .start_stop_btn'),
      restartBtn = $('#' + data.id + ' .restart_btn');

   startStopBtn.attr('disabled', false);
   startStopBtn.attr('data-start-btn', false);
   startStopBtn.text(STOP_BTN_LABEL);
   restartBtn.attr('disabled', false);

   state.text(STATE_LABEL_PRE + (data.running ? 'Running' : 'Stopped'));
   pid.text(PID_LABEL_PRE + data.pid);
   link.attr('href', 'http://' + location.hostname + ':' + data.port + '/');
   link.attr('data-port', data.port);
   link.text(location.hostname + ':' + data.port);
});

socket.on('stopped', function(id) {
   var state = $('#' + id + ' .state'),
      pid = $('#' + id + ' .pid'),
      startStopBtn = $('#' + id + ' .start_stop_btn'),
      restartBtn = $('#' + id + ' .restart_btn');

   startStopBtn.attr('disabled', false);
   startStopBtn.attr('data-start-btn', true);
   startStopBtn.text(START_BTN_LABEL);
   restartBtn.attr('disabled', true);

   state.text(STATE_LABEL_PRE + 'Stopped');
   pid.text(PID_LABEL_PRE + '0');
});