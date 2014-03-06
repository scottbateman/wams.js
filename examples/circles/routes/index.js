
exports.share = function(req, res) {
   res.render('share', { title: 'Share mode using library' })
};

exports.mirror = function(req, res) {
   res.render('mirror', { title: 'Mirror mode using library' })
};
