const api = require("../app/api/movie");

exports.reply = function* (next) {
    let reply = "sorry";
    let message = this.weixin;
    if (message.MsgType === "event") {
        if (message.Event === "subscribe") {
            reply = `欢迎关注电影之家\n回复1~2，测试文字回复\n回复3，测试图文回复\n回复电影名字，查询电影信息\n回复语音，查询电影信息\n点击<a href="http://myfirstwechat.tunnel.qydev.com/movie">语音查电影</a>`;
        }
    } else if (message.MsgType === "text") {
        let content = message.Content;
        if (content === "1") {
            reply = "你好";
        } else if (content === "2") {
            reply = "欢迎光临电影之家";
        } else if (content === "3") {
            reply = [{
                title: "电影之家",
                description: "这是一个能够提供您想找的电影的信息的订阅号",
                picurl: "http://img.19yxw.com/wy/update/20160616/2016061610568.jpg",
                url: "https://github.com/Sakitama/officialaccounts"
            }];
        } else {
            let movies = yield api.searchByName(content);
            if (!movies || movies.length === 0) { //数据库没有要查询的电影
                movies = yield api.searchByDouBan(content);
            }
            if (movies && movies.length > 0) {
                reply = [];
                movies = movies.slice(0, 8); //最多8条，文档说最多10条，不知道为什么
                movies.forEach((movie) => {
                    reply.push({
                        title: movie.title,
                        description: movie.summary,
                        picurl: movie.poster,
                        url: `http://myfirstwechat.tunnel.qydev.com/movie/${movie._id}`
                    });
                });
            } else {
                reply =`没有查询到与${content}相匹配的电影，亲，换个名字试试`;
            }
        }
    } else if (message.MsgType === "voice") {
        let voiceText = message.Recognition;
        let movies = yield api.searchByName(voiceText);
        if (!movies || movies.length === 0) { //数据库没有要查询的电影
            movies = yield api.searchByDouBan(voiceText);
        }
        if (movies && movies.length > 0) {
            reply = [];
            movies = movies.slice(0, 8);
            movies.forEach((movie) => {
                reply.push({
                    title: movie.title,
                    description: movie.title,
                    picurl: movie.poster,
                    url: `http://myfirstwechat.tunnel.qydev.com/movie/${movie._id}`
                });
            });
        } else {
            reply =`没有查询到与${voiceText}相匹配的电影，亲，换个名字试试`;
        }
    }
    this.body = reply;
    yield next;
};