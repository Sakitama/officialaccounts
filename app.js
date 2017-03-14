const Koa = require('koa');
const config = require("./config");
const Wechat = require("./wechat/Wechat");
const menu = require("./wx/menu");
const fs = require("fs");
const mongoose = require("mongoose");
const wechat = require("./app/controllers/wechat");
const views = require("koa-views");
const app = new Koa();
const game = require("./app/controllers/game");
const Router = require("koa-router");

app.use(views(__dirname + "/app/views", {
    extension: "jade"
}));

let wechatApi = new Wechat(config.wechat);

wechatApi.deleteMenu().then(() => {
    return wechatApi.createMenu(menu);
}).catch((err) => {
    console.error(err);
});

let router = new Router();

router.get("/movie", game.movie);
router.get("/movie/:id", game.find);
router.get("/wx", wechat.hear);
router.post("/wx", wechat.hear);
app.use(router.routes()).use(router.allowedMethods());

// movie为mongodb的一个数据库
var dbUrl = 'mongodb://localhost/movie';
mongoose.connect(dbUrl);
var models_path = __dirname + '/app/models';
var walk = function (path) {
    fs.readdirSync(path).forEach(function (file) {
        var newPath = path + '/' + file;
        var stat = fs.statSync(newPath);
        if (stat.isFile()) {
            if (/(.*)\.(js|coffee)/.test(file)) {
                require(newPath);
            }
        } else if (stat.isDirectory) {
            walk(newPath);
        }
    });
};
walk(models_path);

app.listen(1234);

