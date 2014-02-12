
/*
 * GET home page.
 */

exports.index = function(req, res) {
  res.render('index', { title: 'Main page' });
};

exports.share = function(req, res) {
   res.render('share', { title: 'Share mode using library' })
};

exports.mirror = function(req, res) {
   res.render('mirror', { title: 'Mirror mode using library' })
};
