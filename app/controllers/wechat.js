const connect = require("../../wechat/g");
const reply = require("../../wx/reply");
const config = require("../../config");
exports.hear = function* (next) {
    this.middle = connect(config.wechat, reply.reply);
    yield this.middle(next);
};