var Comment = require('../models/comment');

module.exports.saveComment = function (req, res) {
    var _comment = req.body.comment;
    var movieId = _comment.movie;
    if (_comment.cid) {
    	Comment.findById(_comment.cid, function (err, comment) {
            if (err) {
                return console.error(err);
            }
    		var reply = {
    			from: _comment.from,
    			to: _comment.tid,
    			content: _comment.content
    		};
    		comment.reply.push(reply);
    		comment.save(function (err, comment) {
    			if (err) {
    				return console.error(err);
    			}
    			res.redirect('/movie/detail/' + movieId);
    		});
    	});
    } else {
    	var comment = new Comment(_comment);
    	comment.save(function (err, comment) {
    		if (err) {
    			return console.error(err);
    		}
    		res.redirect('/movie/detail/' + movieId);
    	});
    }
};