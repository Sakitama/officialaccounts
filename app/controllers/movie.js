var Movie = require('../models/movie');
var Comment = require('../models/comment');
var Category = require('../models/category');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

// 电影列表页
module.exports.toMovieListPage = function (req, res) {
    Movie.fetch(function (err, movies) {
        if (err) {
            return console.error(err);
        }
        res.render('movieList', {
            title:'电影-列表', 
            movies: movies
        });
    });
};

// 电影详情页
module.exports.toMovieDetailPage = function (req, res) {
    var id = req.params.id;
    //增加pv次数
    Movie.update({
        _id: id
    }, {
        $inc: {
            pv: 1
        }
    }, function (err) {
        if (err) {
            return console.error(err);
        }
    });
    Movie.findById(id, function (err, movie) {
        if (err) {
            return console.error(err);
        }
        Comment.find({ //找出所有指向当前电影的评论
            movie: id
        })
        .populate('from', 'name')
        .populate('reply.from reply.to', 'name')
        .exec(function (err, comments) {
            if (err) {
                return console.error(err);
            }
            res.render('movieDetail', {
                title: '电影-详情', 
                movie: movie,
                comments: comments
            });
        });
    });
};

// 后台更新页
module.exports.toMovieUpdatePage = function (req, res) {
    var id = req.params.id;

    if (id) {
        Movie.findById(id, function (err, movie) {
            if (err) {
                return console.error(err);
            }
            Category.find({}, function (err, categories) {
                if (err) {
                    return console.error(err);
                }
                res.render('movieAddOrUpdate', {
                    title: '后台更新页',
                    movie: movie,
                    categories: categories
                });
            });
        });
    }
};

 // 后台录入页
module.exports.toMovieAddPage = function (req, res) {
    Category.find({}, function (err, categories) {
        if (err) {
            return console.error(err);
        }
        res.render('movieAddOrUpdate', {
            title: '电影-后台录入页', 
            categories: categories,
            movie: {}
        });
    });
};

//逻辑控制：存储海报
module.exports.savePoster = function (req, res, next) {
    var posterData = req.files.uploadPoster;
    var filePath = posterData.path;
    var originalFilename = posterData.originalFilename;
    if (originalFilename) {
        fs.readFile(filePath, function (err, data) {
            var timestamp = Date.now();
            var type = posterData.type.split('/')[1];
            var poster = timestamp + '.' + type;
            var newPath = path.join(__dirname, '../../', '/public/upload/' + poster);
            fs.writeFile(newPath, data, function (err) {
                if (err) {
                    return console.error(err);
                }
                req.poster = poster;
                next();
            });
        });
    } else {
        next();
    }
};

// 逻辑控制：录入或更新
module.exports.addMovie = function (req, res) {
    var movieObj = req.body.movie;
    var id = movieObj._id;
    var _movie;
    var categoryId;
    var categoryName = movieObj.categoryName;

    if (req.poster) {
        movieObj.poster = req.poster;
    }
    
    if (id) { //更新逻辑
        Movie.findById(id, function (err, movie) {
            if (err) {
                return console.error(err);
            }
            _movie = _.extend(movie, movieObj);
            categoryId = _movie.category;
            _movie.save(function (err, movie) {
                if (err) {
                    return console.error(err);
                }

                // 将电影从之前所在的分类里移除
                Category.find({}, function (err, categories) {
                    if (err) {
                        return console.error(err);
                    }
                    categories.forEach(function (category) {
                        category.movies.forEach(function (item) {
                            if (item.toString() === movie._id.toString()) {
                                category.movies.splice(category.movies.indexOf(item), 1);
                                category.save(function (err, category) {
                                    if (err) {
                                        return console.error(err);
                                    }
                                });
                            }
                        });
                    });
                });

                // 将该电影插入到新的分类之中
                Category.findById(categoryId, function (err, category) {
                    if (err) {
                        return console.error(err);
                    }
                    category.movies.push(movie._id);
                    category.save(function (err, category) {
                        if (err) {
                            return console.error(err);
                        }
                        res.redirect('/movie/detail/' + movie._id);
                    });
                });
            });
        });
    } else { //录入逻辑
        _movie = new Movie(movieObj);
        categoryId = _movie.category;
        _movie.save(function (err, movie) {
            if (err) {
                return console.error(err);
            }
            // 选择了单选框
            if (categoryId) {
                Category.findById(categoryId, function (err, category) {
                    if (err) {
                        return console.error(err);
                    }
                    category.movies.push(movie._id);
                    category.save(function (err, category) {
                        if (err) {
                            return console.error(err);
                        }
                        res.redirect('/movie/detail/' + movie._id);
                    });
                });
            } else if (categoryName) {
                // 没有选择单选框，输入了分类名
                var category = new Category({
                    name: categoryName,
                    movies: [movie._id]
                });
                category.save(function (err, category) {
                    if (err) {
                        return console.error(err);
                    }
                    // 由于是输入的分类，没有categoryId，所以需要把categoryId传递过去
                    movie.category = category._id;
                    movie.save(function (err, movie) {
                        if (err) {
                            return console.error(err);
                        }
                        res.redirect('/movie/detail/' + movie._id);
                    });
                });
            } else {
                //单选框和文本框都没有输入，进入未分类
                Category.find({
                    name: '未分类'
                }, function (err, categories) {
                    if (err) {
                        return console.error(err);
                    }
                    var category = categories[0];
                    category.movies.push(movie._id);
                    category.save(function (err, category) {
                        if (err) {
                            return console.error(err);
                        }
                        movie.category = category._id;
                        movie.save(function (err, movie) {
                            if (err) {
                                return console.error(err);
                            }
                            res.redirect('/movie/detail/' + movie._id);
                        });
                    });
                });
            }
        });
    }
};

 // 逻辑控制：删除
module.exports.deleteMovie = function (req, res) {
    var id = req.query.id;

    if (id) {
        Movie.remove({
            _id: id
        }, function (err, movie) {
            if (err) {
                return console.error(err);
            }
            res.json({
                success: true
            });
        });
    }
};