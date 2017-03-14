var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var SALT_WORK_FACTOR = 10;

var change = function (i) {
    return i < 10 ? '0' + i : i;
};
var format = function (date) {
    return date.getFullYear() + '-' + change(date.getMonth() + 1) + '-' + change(date.getDate()) + ' ' + change(date.getHours()) + ':' + change(date.getMinutes()) + ':' + change(date.getSeconds());
};

var UserSchema = new mongoose.Schema({
    name: {
        unique: true,
        type: String
    },
    password: String,
    // 使用数字表示用户的等级，等级大于10的用户为管理员
    role: {
        type: Number,
        default: 0
    },
    meta: {
        createAt: {
            type: String,
            default: format(new Date())
        },
        updateAt: {
            type: String,
            default: format(new Date())
        }
    }
});

UserSchema.pre('save', function (next) {
    var user = this;
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = format(new Date());
    } else {
        this.meta.updateAt = format(new Date());
    }

    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

// 增加实例方法
UserSchema.methods = {
    comparePassword: function (_password, cb) {
        bcrypt.compare(_password, this.password, function (err, isMatch) {
            if (err) {
                return cb(err);
            }
            cb(null, isMatch);
        });
    }
};

UserSchema.statics = {
    fetch: function (cb) {
        return this
            .find({})
            .sort('meta.updateAt')
            .exec(cb);
    },
    findById: function (id, cb) {
        return this
            .findOne({_id: id})
            .exec(cb);
    }
};

module.exports = UserSchema;