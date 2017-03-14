var User = require('../models/user');

// 逻辑控制：用户注册
module.exports.userSignup = function (req, res) {
    var _user = req.body.user;
    // req.param('user'); express deprecated req.param(name): Use req.params, req.body, or req.query instead at
    // req.params 写在路由里的user内容，比如上面的更新路由里的id
    // req.body.user POST请求里的user内容
    // req.query GET请求里的user内容
    var newUser;
    // 检测是否存在已注册的用户名
    User.findOne({
        name: _user.name
    }, function (err, user) {
        if (err) {
            return console.error(err);
        }
        if (user) { //存在已注册的用户名
            return res.redirect('/signin');
        } else {
            newUser = new User(_user);
            newUser.save(function function_name(err, user) {
                if (err) {
                    return console.error(err);
                }
                res.redirect('/');
            });
        }
    });
};

// 用户注册页
module.exports.showSignup = function (req, res) {
    res.render('signup', {
        title:'注册页面'
    });
};

// 逻辑控制：用户登陆
module.exports.userSignin = function (req, res) {
    var _user = req.body.user;
    var name = _user.name;
    var password = _user.password;

    User.findOne({
        name: name
    }, function (err, user) {
        if (err) {
            return console.error(err);
        }
        if (!user) {
            return res.redirect('/signup');
        }
        user.comparePassword(password, function (err, isMatch) {
            if (err) {
                return console.error(err);
            }
            if (isMatch) {
                req.session.user = user;
                return res.redirect('/');
            } else {
                return res.redirect('/signin');
            }
        });
    });
};

// 用户登陆页
module.exports.showSignin = function (req, res) {
    res.render('signin', {
        title:'登陆页面'
    });
};

// 逻辑控制：用户登出
module.exports.userLogout = function (req, res) {
    delete req.session.user;
    res.redirect('/');
};

// 需要用户已经登陆
module.exports.signinRequired = function (req, res, next) {
    var user = req.session.user;
    if (!user) {
        return res.redirect('/signin');
    }
    next();
};

// 需要用户是管理员
module.exports.adminRequired = function (req, res, next) {
    var user = req.session.user;
    if (user.role > 10) {
        next();
    } else {
        return res.redirect('/signin');
    }
};

// 注册用户列表页
module.exports.userList = function (req, res) {
    User.fetch(function (err, users) {
        if (err) {
            return console.error(err);
        }
        res.render('userlist', {
            title:'用户-列表', 
            users: users
        });
    });
};