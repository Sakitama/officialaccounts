var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var change = function (i) {
    return i < 10 ? '0' + i : i;
};
var format = function (date) {
    return date.getFullYear() + '-' + change(date.getMonth() + 1) + '-' + change(date.getDate()) + ' ' + change(date.getHours()) + ':' + change(date.getMinutes()) + ':' + change(date.getSeconds());
};
var MovieSchema = new Schema({
    doctor: String,
    title: String,
    doubanId: String,
    language: String,
    country: String,
    year: String,
    summary: String,
    poster: String,
    genres: [String],
    flash: String,
    pv: {
        type: Number,
        default: 0
    },
    category: {
        type: ObjectId,
        ref: 'Category'
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

MovieSchema.pre('save', function (next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = format(new Date());
    } else {
        this.meta.updateAt = format(new Date());
    }
    next();
});

MovieSchema.statics = {
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

module.exports = MovieSchema;