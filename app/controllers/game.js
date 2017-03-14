const config = require("../../config");
const Wechat = require("../../wechat/Wechat");
const util = require("../../libs/util");
const Movie = require("../api/movie");

exports.movie = function* () {
    let wechatApi = new Wechat(config.wechat);
    let data = yield wechatApi.fetchJSapiTicket().catch((err) => {
        console.error(err);
    });
    yield this.render("wechat/game", util.sign(data.ticket, this.href));
};

exports.find = function* () {
    let id = this.params.id;
    let wechatApi = new Wechat(config.wechat);
    let data = yield wechatApi.fetchJSapiTicket().catch((err) => {
        console.error(err);
    });
    let movie = yield Movie.searchById(id);
    let params = util.sign(data.ticket, this.href);
    params.movie = movie;
    yield this.render("wechat/movie", params);
};