var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var change = function (i) {
    return i < 10 ? '0' + i : i;
};
var format = function (date) {
    return date.getFullYear() + '-' + change(date.getMonth() + 1) + '-' + change(date.getDate()) + ' ' + change(date.getHours()) + ':' + change(date.getMinutes()) + ':' + change(date.getSeconds());
};

var CategorySchema = new mongoose.Schema({
    name: String,
    movies: [{
        type: ObjectId,
        ref: 'Movie'
    }],
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

CategorySchema.pre('save', function (next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = format(new Date());
    } else {
        this.meta.updateAt = format(new Date());
    }
    next();
});

CategorySchema.statics = {
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

module.exports = CategorySchema;